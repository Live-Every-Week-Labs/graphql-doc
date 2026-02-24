import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { runInit } from './init.js';
import { ExampleFileSchema } from '../../core/metadata/validator.js';

// Mock @inquirer/prompts
vi.mock('@inquirer/prompts', () => ({
  input: vi.fn(),
  confirm: vi.fn(),
  select: vi.fn(),
}));

describe('init command', () => {
  let testDir: string;

  beforeEach(async () => {
    // Create a temporary directory for testing
    testDir = path.join(os.tmpdir(), `graphql-doc-test-${Date.now()}`);
    await fs.ensureDir(testDir);
  });

  afterEach(async () => {
    // Clean up test directory
    await fs.remove(testDir);

    // Clear all mocks
    vi.clearAllMocks();
  });

  describe('with --yes flag (non-interactive)', () => {
    it('creates .graphqlrc with default config', async () => {
      await runInit({ yes: true, targetDir: testDir });

      const graphqlrcPath = path.join(testDir, '.graphqlrc');
      expect(await fs.pathExists(graphqlrcPath)).toBe(true);

      const content = await fs.readFile(graphqlrcPath, 'utf-8');
      expect(content).toContain('schema: schema.graphql');
      expect(content).toContain('graphql-doc:');
      expect(content).toContain('outputDir: ./docs/api');
      expect(content).toContain('framework: docusaurus');
      expect(content).toContain('metadataDir: ./docs-metadata');
      expect(content).toContain('adapters:');
      expect(content).toContain('docusaurus: {}');
    });

    it('creates docs-metadata directory structure', async () => {
      await runInit({ yes: true, targetDir: testDir });

      const queriesDir = path.join(testDir, 'docs-metadata', 'examples', 'queries');
      const mutationsDir = path.join(testDir, 'docs-metadata', 'examples', 'mutations');
      expect(await fs.pathExists(queriesDir)).toBe(true);
      expect(await fs.pathExists(mutationsDir)).toBe(true);
    });

    it('creates valid example query JSON file', async () => {
      await runInit({ yes: true, targetDir: testDir });

      const queryExamplePath = path.join(
        testDir,
        'docs-metadata',
        'examples',
        'queries',
        'example-query.json'
      );
      expect(await fs.pathExists(queryExamplePath)).toBe(true);

      const content = await fs.readJson(queryExamplePath);
      expect(content.operation).toBe('exampleQuery');
      expect(content.operationType).toBe('query');
      expect(content.examples).toHaveLength(1);

      // Validate against schema
      const result = ExampleFileSchema.safeParse(content);
      expect(result.success).toBe(true);
    });

    it('creates valid example mutation JSON file', async () => {
      await runInit({ yes: true, targetDir: testDir });

      const mutationExamplePath = path.join(
        testDir,
        'docs-metadata',
        'examples',
        'mutations',
        'example-mutation.json'
      );
      expect(await fs.pathExists(mutationExamplePath)).toBe(true);

      const content = await fs.readJson(mutationExamplePath);
      expect(content.operation).toBe('exampleMutation');
      expect(content.operationType).toBe('mutation');
      expect(content.examples).toHaveLength(1);

      // Validate against schema
      const result = ExampleFileSchema.safeParse(content);
      expect(result.success).toBe(true);
    });
  });

  describe('existence checking', () => {
    it('throws error when .graphqlrc exists in --yes mode', async () => {
      // Create existing .graphqlrc
      await fs.writeFile(path.join(testDir, '.graphqlrc'), 'existing config');

      await expect(runInit({ yes: true, targetDir: testDir })).rejects.toThrow(
        'Cannot overwrite existing files in non-interactive mode'
      );
    });

    it('throws error when docs-metadata exists in --yes mode', async () => {
      // Create existing docs-metadata directory
      await fs.ensureDir(path.join(testDir, 'docs-metadata'));

      await expect(runInit({ yes: true, targetDir: testDir })).rejects.toThrow(
        'Cannot overwrite existing files in non-interactive mode'
      );
    });

    it('throws error when directives file exists in --yes mode', async () => {
      await fs.writeFile(path.join(testDir, 'graphql-doc-directives.graphql'), '# existing');

      await expect(runInit({ yes: true, targetDir: testDir })).rejects.toThrow(
        'Cannot overwrite existing files in non-interactive mode'
      );
    });
  });

  describe('--force flag', () => {
    it('overwrites existing files when --force is used', async () => {
      // Create existing .graphqlrc
      await fs.writeFile(path.join(testDir, '.graphqlrc'), 'old config');

      await runInit({ yes: true, force: true, targetDir: testDir });

      const content = await fs.readFile(path.join(testDir, '.graphqlrc'), 'utf-8');
      expect(content).toContain('schema: schema.graphql');
      expect(content).not.toContain('old config');
    });

    it('overwrites existing docs-metadata when --force is used', async () => {
      // Create existing docs-metadata with different content
      await fs.ensureDir(path.join(testDir, 'docs-metadata'));
      await fs.writeFile(path.join(testDir, 'docs-metadata', 'old-file.json'), 'old content');

      await runInit({ yes: true, force: true, targetDir: testDir });

      // Verify new files were created
      const queryExamplePath = path.join(
        testDir,
        'docs-metadata',
        'examples',
        'queries',
        'example-query.json'
      );
      expect(await fs.pathExists(queryExamplePath)).toBe(true);
    });

    it('overwrites directives file when --force is used', async () => {
      await fs.writeFile(path.join(testDir, 'graphql-doc-directives.graphql'), 'old directives');

      await runInit({ yes: true, force: true, targetDir: testDir });

      const directivesContent = await fs.readFile(
        path.join(testDir, 'graphql-doc-directives.graphql'),
        'utf-8'
      );
      expect(directivesContent).toContain('directive @docGroup');
      expect(directivesContent).not.toContain('old directives');
    });
  });

  describe('interactive mode', () => {
    it('returns early when user declines to overwrite', async () => {
      const { confirm } = await import('@inquirer/prompts');
      const mockedConfirm = vi.mocked(confirm);

      // Create existing .graphqlrc
      await fs.writeFile(path.join(testDir, '.graphqlrc'), 'existing config');

      // Mock confirm to return false (don't overwrite)
      mockedConfirm.mockResolvedValueOnce(false);

      // Should resolve without throwing (early return)
      await expect(runInit({ targetDir: testDir })).resolves.toBeUndefined();
      expect(mockedConfirm).toHaveBeenCalled();
    });

    it('proceeds with overwrite when user confirms', async () => {
      const { confirm, input } = await import('@inquirer/prompts');
      const mockedConfirm = vi.mocked(confirm);
      const mockedInput = vi.mocked(input);

      // Create existing .graphqlrc
      await fs.writeFile(path.join(testDir, '.graphqlrc'), 'existing config');

      // Mock confirm to return true (overwrite)
      mockedConfirm.mockResolvedValueOnce(true);

      // Mock input prompts with default values
      mockedInput
        .mockResolvedValueOnce('schema.graphql')
        .mockResolvedValueOnce('./docs/api')
        .mockResolvedValueOnce('./docs-metadata');

      await runInit({ targetDir: testDir });

      // Verify files were created
      const content = await fs.readFile(path.join(testDir, '.graphqlrc'), 'utf-8');
      expect(content).toContain('schema: schema.graphql');
    });

    it('uses custom values from prompts', async () => {
      const { input } = await import('@inquirer/prompts');
      const mockedInput = vi.mocked(input);

      // Mock input prompts with custom values
      mockedInput
        .mockResolvedValueOnce('custom-schema.graphql')
        .mockResolvedValueOnce('./output/docs')
        .mockResolvedValueOnce('./custom-metadata');

      await runInit({ targetDir: testDir });

      // Verify .graphqlrc uses custom values
      const content = await fs.readFile(path.join(testDir, '.graphqlrc'), 'utf-8');
      expect(content).toContain('schema: custom-schema.graphql');
      expect(content).toContain('outputDir: ./output/docs');
      expect(content).toContain('metadataDir: ./custom-metadata');

      // Verify custom metadata directory was created
      expect(
        await fs.pathExists(path.join(testDir, 'custom-metadata', 'examples', 'queries'))
      ).toBe(true);
    });

    it('escapes YAML values from prompts that include special characters', async () => {
      const { input } = await import('@inquirer/prompts');
      const mockedInput = vi.mocked(input);

      mockedInput
        .mockResolvedValueOnce('schema:prod.graphql')
        .mockResolvedValueOnce('./docs/api #prod')
        .mockResolvedValueOnce('./metadata "docs"');

      await runInit({ targetDir: testDir });

      const content = await fs.readFile(path.join(testDir, '.graphqlrc'), 'utf-8');
      expect(content).toContain('schema: "schema:prod.graphql"');
      expect(content).toContain('outputDir: "./docs/api #prod"');
      expect(content).toContain('metadataDir: "./metadata \\"docs\\""');
    });
  });
});
