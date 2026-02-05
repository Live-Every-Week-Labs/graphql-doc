import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { buildSchema } from 'graphql';
import { Generator } from './generator.js';
import { Config } from './config/schema.js';

// Test schema content
const TEST_SCHEMA = `
directive @docGroup(name: String!, order: Int, subsection: String) on OBJECT | FIELD_DEFINITION
directive @docPriority(level: Int!) on FIELD_DEFINITION
directive @docTags(tags: [String!]!) on FIELD_DEFINITION

type Query {
  "Get a user by ID"
  getUser(id: ID!): User @docGroup(name: "Users", order: 1)

  "List all users"
  listUsers: [User!]! @docGroup(name: "Users", order: 1) @docPriority(level: 2)
}

type Mutation {
  "Create a new user"
  createUser(name: String!, email: String!): User @docGroup(name: "Users", order: 1)
}

"A user in the system"
type User {
  id: ID!
  name: String!
  email: String!
}
`;

// Mock SchemaLoader to avoid graphql instance mismatch issues
vi.mock('./parser/schema-loader', () => {
  return {
    SchemaLoader: class {
      async load() {
        return buildSchema(TEST_SCHEMA);
      }
    },
  };
});

describe('Generator', () => {
  let testDir: string;
  let outputDir: string;
  let metadataDir: string;
  let config: Config;

  beforeEach(async () => {
    // Create a temporary directory for testing
    testDir = path.join(os.tmpdir(), `graphql-docs-generator-test-${Date.now()}`);
    outputDir = path.join(testDir, 'output');
    metadataDir = path.join(testDir, 'metadata');

    await fs.ensureDir(testDir);
    await fs.ensureDir(outputDir);
    await fs.ensureDir(metadataDir);
    await fs.ensureDir(path.join(metadataDir, 'examples'));

    config = {
      outputDir,
      framework: 'docusaurus',
      metadataDir,
      examplesDir: path.join(metadataDir, 'examples'),
      allowRemoteSchema: false,
      typeExpansion: {
        maxDepth: 2,
        defaultLevels: 3,
        showCircularReferences: true,
      },
      llmDocs: {
        enabled: false,
        outputDir: path.join(testDir, 'llm-docs'),
        strategy: 'chunked',
        includeExamples: true,
        generateManifest: true,
        singleFileName: 'api-reference.md',
        maxTypeDepth: 3,
      },
      adapters: {
        docusaurus: {
          unsafeMdxDescriptions: false,
          typeLinkMode: 'none',
          generateSidebar: true,
        },
      },
    };
  });

  afterEach(async () => {
    // Clean up test directory
    await fs.remove(testDir);
    vi.clearAllMocks();
  });

  describe('generate()', () => {
    it('generates documentation from valid schema', async () => {
      const generator = new Generator(config);
      await generator.generate('schema.graphql');

      // Verify output directory was created
      expect(await fs.pathExists(outputDir)).toBe(true);

      // Verify sidebars file was created
      expect(await fs.pathExists(path.join(outputDir, 'sidebars.js'))).toBe(true);
    });

    it('generates MDX files for operations', async () => {
      const generator = new Generator(config);
      await generator.generate('schema.graphql');

      // Check for generated MDX files in users directory
      const usersDir = path.join(outputDir, 'users');
      expect(await fs.pathExists(usersDir)).toBe(true);

      // Should have files for getUser, listUsers, createUser
      const files = await fs.readdir(usersDir);
      expect(files.length).toBeGreaterThan(0);
    });

    it('generates category files for sections', async () => {
      const generator = new Generator(config);
      await generator.generate('schema.graphql');

      // Check for _category_.json file
      const categoryFile = path.join(outputDir, 'users', '_category_.json');
      expect(await fs.pathExists(categoryFile)).toBe(true);

      const content = await fs.readJson(categoryFile);
      expect(content.label).toBe('Users');
    });

    it('generates sidebar configuration', async () => {
      const generator = new Generator(config);
      await generator.generate('schema.graphql');

      const sidebarPath = path.join(outputDir, 'sidebars.js');
      expect(await fs.pathExists(sidebarPath)).toBe(true);

      const content = await fs.readFile(sidebarPath, 'utf-8');
      expect(content).toContain('module.exports');
    });

    it('generates MDX content with descriptions', async () => {
      const generator = new Generator(config);
      await generator.generate('schema.graphql');

      // Find and read a generated MDX file
      const usersDir = path.join(outputDir, 'users');
      const files = await fs.readdir(usersDir);
      const mdxFile = files.find((f) => f.endsWith('.mdx'));

      if (mdxFile) {
        const content = await fs.readFile(path.join(usersDir, mdxFile), 'utf-8');
        // Should contain frontmatter
        expect(content).toContain('---');
        // Should contain some content
        expect(content.length).toBeGreaterThan(50);
      }
    });

    it('loads and merges example metadata', async () => {
      // Create example file
      const exampleFile = path.join(metadataDir, 'examples', 'get-user.json');
      await fs.writeJson(exampleFile, {
        operation: 'getUser',
        operationType: 'query',
        examples: [
          {
            name: 'Get User Example',
            query: 'query { getUser(id: "1") { id name } }',
            response: {
              type: 'success',
              httpStatus: 200,
              body: { data: { getUser: { id: '1', name: 'Test' } } },
            },
          },
        ],
      });

      const generator = new Generator(config);
      await generator.generate('schema.graphql');

      // Verify generation completed
      expect(await fs.pathExists(path.join(outputDir, 'sidebars.js'))).toBe(true);
    });

    it('creates correct directory structure', async () => {
      const generator = new Generator(config);
      await generator.generate('schema.graphql');

      // Verify directory structure
      expect(await fs.pathExists(outputDir)).toBe(true);

      // Output dir should have content
      const contents = await fs.readdir(outputDir);
      expect(contents.length).toBeGreaterThan(0);

      // Should have sidebars.js
      expect(contents).toContain('sidebars.js');
    });
  });

  describe('configuration', () => {
    it('respects custom output directory', async () => {
      const customOutput = path.join(testDir, 'custom-docs');
      const customConfig = { ...config, outputDir: customOutput };

      const generator = new Generator(customConfig);
      await generator.generate('schema.graphql');

      expect(await fs.pathExists(customOutput)).toBe(true);
      expect(await fs.pathExists(path.join(customOutput, 'sidebars.js'))).toBe(true);
    });

    it('handles empty metadata directories', async () => {
      const generator = new Generator(config);

      // Should not throw even with empty metadata directories
      await expect(generator.generate('schema.graphql')).resolves.not.toThrow();
    });
  });
});
