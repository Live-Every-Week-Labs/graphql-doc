import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { runInit } from './init.js';
import { ExampleFileSchema, ErrorFileSchema } from '../../core/metadata/validator.js';

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
    testDir = path.join(os.tmpdir(), `graphql-docs-test-${Date.now()}`);
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
      expect(content).toContain('graphql-docs:');
      expect(content).toContain('outputDir: ./docs/api');
      expect(content).toContain('framework: docusaurus');
      expect(content).toContain('metadataDir: ./docs-metadata');
    });

    it('creates docs-metadata directory structure', async () => {
      await runInit({ yes: true, targetDir: testDir });

      const queriesDir = path.join(testDir, 'docs-metadata', 'examples', 'queries');
      const mutationsDir = path.join(testDir, 'docs-metadata', 'examples', 'mutations');
      const errorsDir = path.join(testDir, 'docs-metadata', 'errors');

      expect(await fs.pathExists(queriesDir)).toBe(true);
      expect(await fs.pathExists(mutationsDir)).toBe(true);
      expect(await fs.pathExists(errorsDir)).toBe(true);
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

    it('creates valid common errors JSON file', async () => {
      await runInit({ yes: true, targetDir: testDir });

      const errorsPath = path.join(testDir, 'docs-metadata', 'errors', 'common-errors.json');
      expect(await fs.pathExists(errorsPath)).toBe(true);

      const content = await fs.readJson(errorsPath);
      expect(content.category).toBe('Common');
      expect(content.operations).toContain('*');
      expect(content.errors).toHaveLength(2);

      // Validate against schema
      const result = ErrorFileSchema.safeParse(content);
      expect(result.success).toBe(true);
    });
  });

  describe('existence checking', () => {
    it('exits with error when .graphqlrc exists in --yes mode', async () => {
      // Create existing .graphqlrc
      await fs.writeFile(path.join(testDir, '.graphqlrc'), 'existing config');

      // Mock process.exit
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      await expect(runInit({ yes: true, targetDir: testDir })).rejects.toThrow(
        'process.exit called'
      );
      expect(mockExit).toHaveBeenCalledWith(1);

      mockExit.mockRestore();
    });

    it('exits with error when docs-metadata exists in --yes mode', async () => {
      // Create existing docs-metadata directory
      await fs.ensureDir(path.join(testDir, 'docs-metadata'));

      // Mock process.exit
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      await expect(runInit({ yes: true, targetDir: testDir })).rejects.toThrow(
        'process.exit called'
      );
      expect(mockExit).toHaveBeenCalledWith(1);

      mockExit.mockRestore();
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
  });

  describe('interactive mode', () => {
    it('prompts for confirmation when files exist', async () => {
      const { confirm } = await import('@inquirer/prompts');
      const mockedConfirm = vi.mocked(confirm);

      // Create existing .graphqlrc
      await fs.writeFile(path.join(testDir, '.graphqlrc'), 'existing config');

      // Mock confirm to return false (don't overwrite)
      mockedConfirm.mockResolvedValueOnce(false);

      // Mock process.exit
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      await expect(runInit({ targetDir: testDir })).rejects.toThrow('process.exit called');
      expect(mockedConfirm).toHaveBeenCalled();
      expect(mockExit).toHaveBeenCalledWith(0);

      mockExit.mockRestore();
    });

    it('proceeds with overwrite when user confirms', async () => {
      const { confirm, input, select } = await import('@inquirer/prompts');
      const mockedConfirm = vi.mocked(confirm);
      const mockedInput = vi.mocked(input);
      const mockedSelect = vi.mocked(select);

      // Create existing .graphqlrc
      await fs.writeFile(path.join(testDir, '.graphqlrc'), 'existing config');

      // Mock confirm to return true (overwrite)
      mockedConfirm.mockResolvedValueOnce(true);

      // Mock input prompts with default values
      mockedInput
        .mockResolvedValueOnce('schema.graphql')
        .mockResolvedValueOnce('./docs/api')
        .mockResolvedValueOnce('./docs-metadata');

      // Mock select prompt
      mockedSelect.mockResolvedValueOnce('docusaurus');

      await runInit({ targetDir: testDir });

      // Verify files were created
      const content = await fs.readFile(path.join(testDir, '.graphqlrc'), 'utf-8');
      expect(content).toContain('schema: schema.graphql');
    });

    it('uses custom values from prompts', async () => {
      const { input, select } = await import('@inquirer/prompts');
      const mockedInput = vi.mocked(input);
      const mockedSelect = vi.mocked(select);

      // Mock input prompts with custom values
      mockedInput
        .mockResolvedValueOnce('custom-schema.graphql')
        .mockResolvedValueOnce('./output/docs')
        .mockResolvedValueOnce('./custom-metadata');

      // Mock select prompt
      mockedSelect.mockResolvedValueOnce('docusaurus');

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
  });
});
