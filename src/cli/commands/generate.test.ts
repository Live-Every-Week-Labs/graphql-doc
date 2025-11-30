import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { buildSchema } from 'graphql';
import { runGenerate } from './generate.js';

// Test schema content
const TEST_SCHEMA = `
directive @docGroup(name: String!, order: Int, subsection: String) on OBJECT | FIELD_DEFINITION

type Query {
  "Get a user by ID"
  getUser(id: ID!): User @docGroup(name: "Users", order: 1)
}

type Mutation {
  "Create a new user"
  createUser(name: String!): User @docGroup(name: "Users", order: 1)
}

"A user in the system"
type User {
  id: ID!
  name: String!
}
`;

// Mock SchemaLoader to avoid graphql instance mismatch issues
vi.mock('../../core/parser/schema-loader', () => {
  return {
    SchemaLoader: class {
      async load() {
        return buildSchema(TEST_SCHEMA);
      }
    },
  };
});

// Mock graphql-config
vi.mock('graphql-config', async () => {
  const actual = await vi.importActual('graphql-config');
  return {
    ...actual,
    loadConfig: vi.fn(),
  };
});

describe('generate command', () => {
  let testDir: string;

  beforeEach(async () => {
    // Create a temporary directory for testing
    testDir = path.join(os.tmpdir(), `graphql-docs-generate-test-${Date.now()}`);
    await fs.ensureDir(testDir);

    // Create required directories
    await fs.ensureDir(path.join(testDir, 'docs-metadata', 'examples'));
    await fs.ensureDir(path.join(testDir, 'docs-metadata', 'errors'));

    // Create a test schema file
    await fs.writeFile(path.join(testDir, 'schema.graphql'), TEST_SCHEMA);
  });

  afterEach(async () => {
    // Clean up test directory
    await fs.remove(testDir);
    vi.clearAllMocks();
  });

  describe('with valid schema', () => {
    it('generates documentation successfully', async () => {
      // Mock process.exit to not actually exit
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      // Run generate - should not throw
      await runGenerate({ schema: 'schema.graphql', targetDir: testDir });

      // Verify output was created
      const outputDir = path.join(testDir, 'docs', 'api');
      expect(await fs.pathExists(outputDir)).toBe(true);

      mockExit.mockRestore();
    });

    it('creates output directory structure', async () => {
      await runGenerate({ schema: 'schema.graphql', targetDir: testDir });

      const outputDir = path.join(testDir, 'docs', 'api');
      expect(await fs.pathExists(outputDir)).toBe(true);

      // Should have users directory
      expect(await fs.pathExists(path.join(outputDir, 'users'))).toBe(true);
    });

    it('generates MDX files for operations', async () => {
      await runGenerate({ schema: 'schema.graphql', targetDir: testDir });

      const usersDir = path.join(testDir, 'docs', 'api', 'users');
      const files = await fs.readdir(usersDir);

      // Should have MDX files
      const mdxFiles = files.filter((f) => f.endsWith('.mdx'));
      expect(mdxFiles.length).toBeGreaterThan(0);
    });

    it('generates sidebar.js', async () => {
      await runGenerate({ schema: 'schema.graphql', targetDir: testDir });

      const sidebarPath = path.join(testDir, 'docs', 'api', 'sidebars.js');
      expect(await fs.pathExists(sidebarPath)).toBe(true);
    });
  });

  describe('with missing schema', () => {
    it('fails with error exit code when schema loading throws', async () => {
      // Temporarily restore SchemaLoader to test real error behavior
      const SchemaLoaderModule = await import('../../core/parser/schema-loader.js');
      const originalLoad = SchemaLoaderModule.SchemaLoader.prototype.load;

      // Mock load to throw an error
      SchemaLoaderModule.SchemaLoader.prototype.load = async () => {
        throw new Error('Schema file not found');
      };

      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      // Run with missing schema - should exit
      await expect(
        runGenerate({ schema: 'nonexistent.graphql', targetDir: testDir })
      ).rejects.toThrow('process.exit called');

      expect(mockExit).toHaveBeenCalledWith(1);

      // Restore original behavior
      SchemaLoaderModule.SchemaLoader.prototype.load = originalLoad;
      mockExit.mockRestore();
    });
  });

  describe('with custom output path', () => {
    it('uses -o/--output option', async () => {
      const customOutput = path.join(testDir, 'custom-output');

      await runGenerate({
        schema: 'schema.graphql',
        output: customOutput,
        targetDir: testDir,
      });

      expect(await fs.pathExists(customOutput)).toBe(true);
      expect(await fs.pathExists(path.join(customOutput, 'sidebars.js'))).toBe(true);
    });
  });

  describe('with custom config', () => {
    it('uses -c/--config option', async () => {
      // Create a custom config file
      const customConfigPath = path.join(testDir, 'custom-config.json');
      const customOutput = path.join(testDir, 'config-output');

      await fs.writeJson(customConfigPath, {
        outputDir: customOutput,
        framework: 'docusaurus',
        metadataDir: './docs-metadata',
      });

      await runGenerate({
        schema: 'schema.graphql',
        config: 'custom-config.json',
        targetDir: testDir,
      });

      expect(await fs.pathExists(customOutput)).toBe(true);
    });
  });

  describe('schema from graphql-config', () => {
    it('reads schema path from .graphqlrc', async () => {
      const { loadConfig } = await import('graphql-config');
      const mockedLoadConfig = vi.mocked(loadConfig);

      // Mock loadConfig to return schema path
      mockedLoadConfig.mockResolvedValueOnce({
        getDefault: () => ({
          schema: 'schema.graphql',
          extension: () => ({}),
        }),
      } as any);

      // Run without explicit schema option
      await runGenerate({ targetDir: testDir });

      // Should still generate output using schema from config
      const outputDir = path.join(testDir, 'docs', 'api');
      expect(await fs.pathExists(outputDir)).toBe(true);
    });

    it('falls back to schema.graphql when not in config', async () => {
      const { loadConfig } = await import('graphql-config');
      const mockedLoadConfig = vi.mocked(loadConfig);

      // Mock loadConfig to throw (no config found)
      mockedLoadConfig.mockRejectedValueOnce(new Error('No config found'));

      // Should use default schema.graphql
      await runGenerate({ targetDir: testDir });

      // Should still generate output using default schema
      const outputDir = path.join(testDir, 'docs', 'api');
      expect(await fs.pathExists(outputDir)).toBe(true);
    });

    it('handles array schema paths from config', async () => {
      const { loadConfig } = await import('graphql-config');
      const mockedLoadConfig = vi.mocked(loadConfig);

      // Mock loadConfig to return array of schema paths
      mockedLoadConfig.mockResolvedValueOnce({
        getDefault: () => ({
          schema: ['schema.graphql', 'other-schema.graphql'],
          extension: () => ({}),
        }),
      } as any);

      await runGenerate({ targetDir: testDir });

      // Should generate output using first schema in array
      const outputDir = path.join(testDir, 'docs', 'api');
      expect(await fs.pathExists(outputDir)).toBe(true);
    });
  });

  describe('error handling', () => {
    it('exits with code 1 on config load error', async () => {
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      // Create invalid config file
      await fs.writeFile(path.join(testDir, 'invalid.json'), 'not valid json{{{');

      await expect(
        runGenerate({
          config: 'invalid.json',
          targetDir: testDir,
        })
      ).rejects.toThrow('process.exit called');

      expect(mockExit).toHaveBeenCalledWith(1);
      mockExit.mockRestore();
    });
  });
});
