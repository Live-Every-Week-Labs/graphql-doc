import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { runValidate } from './validate.js';

describe('validate command', () => {
  let testDir: string;

  beforeEach(async () => {
    // Create a temporary directory for testing
    testDir = path.join(os.tmpdir(), `graphql-docs-validate-test-${Date.now()}`);
    await fs.ensureDir(testDir);
  });

  afterEach(async () => {
    // Clean up test directory
    await fs.remove(testDir);

    // Clear all mocks
    vi.clearAllMocks();
  });

  describe('schema validation', () => {
    it('fails when schema file is not found', async () => {
      // Mock process.exit
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      await expect(
        runValidate({ schema: 'nonexistent.graphql', targetDir: testDir })
      ).rejects.toThrow('process.exit called');

      expect(mockExit).toHaveBeenCalledWith(1);
      mockExit.mockRestore();
    });

    it('passes with valid schema', async () => {
      // Create a valid schema
      const schemaPath = path.join(testDir, 'schema.graphql');
      await fs.writeFile(
        schemaPath,
        `
        type Query {
          hello: String
        }
        `
      );

      // Create required metadata directories (empty)
      await fs.ensureDir(path.join(testDir, 'docs-metadata', 'examples'));
      await fs.ensureDir(path.join(testDir, 'docs-metadata', 'errors'));

      // Mock process.exit
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      await expect(runValidate({ targetDir: testDir })).rejects.toThrow('process.exit called');

      // Exit code 0 for success
      expect(mockExit).toHaveBeenCalledWith(0);
      mockExit.mockRestore();
    });

    it('fails with invalid GraphQL syntax', async () => {
      // Create an invalid schema
      const schemaPath = path.join(testDir, 'schema.graphql');
      await fs.writeFile(schemaPath, 'this is not valid graphql {{{');

      // Mock process.exit
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      await expect(runValidate({ targetDir: testDir })).rejects.toThrow('process.exit called');

      expect(mockExit).toHaveBeenCalledWith(1);
      mockExit.mockRestore();
    });

    it('passes with valid custom directives', async () => {
      // Create a schema with valid custom directives
      const schemaPath = path.join(testDir, 'schema.graphql');
      await fs.writeFile(
        schemaPath,
        `
        directive @docGroup(name: String!, order: Int!, subsection: String) on FIELD_DEFINITION
        directive @docPriority(level: Int!) on FIELD_DEFINITION
        directive @docTags(tags: [String!]!) on FIELD_DEFINITION

        type Query {
          users: [User] @docGroup(name: "Users", order: 1) @docPriority(level: 1) @docTags(tags: ["users"])
        }

        type User {
          id: ID!
          name: String
        }
        `
      );

      // Create required metadata directories
      await fs.ensureDir(path.join(testDir, 'docs-metadata', 'examples'));
      await fs.ensureDir(path.join(testDir, 'docs-metadata', 'errors'));

      // Mock process.exit
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      await expect(runValidate({ targetDir: testDir })).rejects.toThrow('process.exit called');

      expect(mockExit).toHaveBeenCalledWith(0);
      mockExit.mockRestore();
    });

    it('fails when directive is missing required arguments', async () => {
      // Create a schema with missing directive arguments
      const schemaPath = path.join(testDir, 'schema.graphql');
      await fs.writeFile(
        schemaPath,
        `
        directive @docGroup(name: String!, order: Int!, subsection: String) on FIELD_DEFINITION

        type Query {
          users: [User] @docGroup(name: "Users")
        }

        type User {
          id: ID!
        }
        `
      );

      // Create required metadata directories
      await fs.ensureDir(path.join(testDir, 'docs-metadata', 'examples'));
      await fs.ensureDir(path.join(testDir, 'docs-metadata', 'errors'));

      // Mock process.exit
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      await expect(runValidate({ targetDir: testDir })).rejects.toThrow('process.exit called');

      expect(mockExit).toHaveBeenCalledWith(1);
      mockExit.mockRestore();
    });
  });

  describe('metadata validation', () => {
    beforeEach(async () => {
      // Create a valid schema for all metadata tests
      const schemaPath = path.join(testDir, 'schema.graphql');
      await fs.writeFile(
        schemaPath,
        `
        type Query {
          getUser(id: ID!): User
        }

        type User {
          id: ID!
          name: String
        }
        `
      );
    });

    it('passes with valid example files', async () => {
      // Create directories
      await fs.ensureDir(path.join(testDir, 'docs-metadata', 'examples', 'queries'));
      await fs.ensureDir(path.join(testDir, 'docs-metadata', 'errors'));

      // Create valid example file
      const examplePath = path.join(
        testDir,
        'docs-metadata',
        'examples',
        'queries',
        'get-user.json'
      );
      await fs.writeJson(examplePath, {
        operation: 'getUser',
        operationType: 'query',
        examples: [
          {
            name: 'Basic Example',
            query: 'query GetUser { getUser(id: "1") { id name } }',
            response: {
              type: 'success',
              httpStatus: 200,
              body: { data: { getUser: { id: '1', name: 'Test' } } },
            },
          },
        ],
      });

      // Mock process.exit
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      await expect(runValidate({ targetDir: testDir })).rejects.toThrow('process.exit called');

      expect(mockExit).toHaveBeenCalledWith(0);
      mockExit.mockRestore();
    });

    it('fails with invalid example JSON', async () => {
      // Create directories
      await fs.ensureDir(path.join(testDir, 'docs-metadata', 'examples'));
      await fs.ensureDir(path.join(testDir, 'docs-metadata', 'errors'));

      // Create invalid JSON file
      const examplePath = path.join(testDir, 'docs-metadata', 'examples', 'invalid.json');
      await fs.writeFile(examplePath, '{ invalid json }');

      // Mock process.exit
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      await expect(runValidate({ targetDir: testDir })).rejects.toThrow('process.exit called');

      expect(mockExit).toHaveBeenCalledWith(1);
      mockExit.mockRestore();
    });

    it('fails with missing required fields in example', async () => {
      // Create directories
      await fs.ensureDir(path.join(testDir, 'docs-metadata', 'examples'));
      await fs.ensureDir(path.join(testDir, 'docs-metadata', 'errors'));

      // Create example file missing required fields
      const examplePath = path.join(testDir, 'docs-metadata', 'examples', 'incomplete.json');
      await fs.writeJson(examplePath, {
        operation: 'getUser',
        // Missing operationType and examples
      });

      // Mock process.exit
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      await expect(runValidate({ targetDir: testDir })).rejects.toThrow('process.exit called');

      expect(mockExit).toHaveBeenCalledWith(1);
      mockExit.mockRestore();
    });

    it('passes with valid error files', async () => {
      // Create directories
      await fs.ensureDir(path.join(testDir, 'docs-metadata', 'examples'));
      await fs.ensureDir(path.join(testDir, 'docs-metadata', 'errors'));

      // Create valid error file
      const errorPath = path.join(testDir, 'docs-metadata', 'errors', 'common.json');
      await fs.writeJson(errorPath, {
        category: 'Common',
        operations: ['*'],
        errors: [
          {
            code: 'UNAUTHORIZED',
            message: 'Not authorized',
            description: 'You need to log in',
          },
        ],
      });

      // Mock process.exit
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      await expect(runValidate({ targetDir: testDir })).rejects.toThrow('process.exit called');

      expect(mockExit).toHaveBeenCalledWith(0);
      mockExit.mockRestore();
    });

    it('fails with missing required fields in error file', async () => {
      // Create directories
      await fs.ensureDir(path.join(testDir, 'docs-metadata', 'examples'));
      await fs.ensureDir(path.join(testDir, 'docs-metadata', 'errors'));

      // Create error file missing required fields
      const errorPath = path.join(testDir, 'docs-metadata', 'errors', 'incomplete.json');
      await fs.writeJson(errorPath, {
        category: 'Common',
        // Missing operations and errors
      });

      // Mock process.exit
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      await expect(runValidate({ targetDir: testDir })).rejects.toThrow('process.exit called');

      expect(mockExit).toHaveBeenCalledWith(1);
      mockExit.mockRestore();
    });
  });

  describe('cross-validation', () => {
    beforeEach(async () => {
      // Create directories
      await fs.ensureDir(path.join(testDir, 'docs-metadata', 'examples'));
      await fs.ensureDir(path.join(testDir, 'docs-metadata', 'errors'));
    });

    it('warns when example references unknown operation', async () => {
      // Create a schema without the referenced operation
      const schemaPath = path.join(testDir, 'schema.graphql');
      await fs.writeFile(
        schemaPath,
        `
        type Query {
          hello: String
        }
        `
      );

      // Create example referencing unknown operation
      const examplePath = path.join(testDir, 'docs-metadata', 'examples', 'unknown.json');
      await fs.writeJson(examplePath, {
        operation: 'unknownOperation',
        operationType: 'query',
        examples: [
          {
            name: 'Example',
            query: 'query { unknownOperation }',
            response: {
              type: 'success',
              httpStatus: 200,
              body: {},
            },
          },
        ],
      });

      // Mock process.exit
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      // Without --strict, should exit 0 (warnings only)
      await expect(runValidate({ targetDir: testDir })).rejects.toThrow('process.exit called');

      expect(mockExit).toHaveBeenCalledWith(0);
      mockExit.mockRestore();
    });

    it('fails in strict mode with warnings', async () => {
      // Create a schema without the referenced operation
      const schemaPath = path.join(testDir, 'schema.graphql');
      await fs.writeFile(
        schemaPath,
        `
        type Query {
          hello: String
        }
        `
      );

      // Create example referencing unknown operation
      const examplePath = path.join(testDir, 'docs-metadata', 'examples', 'unknown.json');
      await fs.writeJson(examplePath, {
        operation: 'unknownOperation',
        operationType: 'query',
        examples: [
          {
            name: 'Example',
            query: 'query { unknownOperation }',
            response: {
              type: 'success',
              httpStatus: 200,
              body: {},
            },
          },
        ],
      });

      // Mock process.exit
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      // With --strict, should exit 1 (warnings treated as errors)
      await expect(runValidate({ targetDir: testDir, strict: true })).rejects.toThrow(
        'process.exit called'
      );

      expect(mockExit).toHaveBeenCalledWith(1);
      mockExit.mockRestore();
    });

    it('does not warn for wildcard operations in errors', async () => {
      // Create a simple schema
      const schemaPath = path.join(testDir, 'schema.graphql');
      await fs.writeFile(
        schemaPath,
        `
        type Query {
          hello: String
        }
        `
      );

      // Create error file with wildcard
      const errorPath = path.join(testDir, 'docs-metadata', 'errors', 'common.json');
      await fs.writeJson(errorPath, {
        category: 'Common',
        operations: ['*'],
        errors: [
          {
            code: 'ERROR',
            message: 'Error',
            description: 'Description',
          },
        ],
      });

      // Mock process.exit
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      await expect(runValidate({ targetDir: testDir })).rejects.toThrow('process.exit called');

      expect(mockExit).toHaveBeenCalledWith(0);
      mockExit.mockRestore();
    });
  });

  describe('CLI options', () => {
    beforeEach(async () => {
      // Create directories
      await fs.ensureDir(path.join(testDir, 'docs-metadata', 'examples'));
      await fs.ensureDir(path.join(testDir, 'docs-metadata', 'errors'));
    });

    it('uses custom schema path', async () => {
      // Create schema in custom location
      const customDir = path.join(testDir, 'graphql');
      await fs.ensureDir(customDir);
      const schemaPath = path.join(customDir, 'custom.graphql');
      await fs.writeFile(
        schemaPath,
        `
        type Query {
          test: String
        }
        `
      );

      // Mock process.exit
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      await expect(
        runValidate({ schema: 'graphql/custom.graphql', targetDir: testDir })
      ).rejects.toThrow('process.exit called');

      expect(mockExit).toHaveBeenCalledWith(0);
      mockExit.mockRestore();
    });

    it('uses custom config file', async () => {
      // Create schema
      const schemaPath = path.join(testDir, 'schema.graphql');
      await fs.writeFile(
        schemaPath,
        `
        type Query {
          test: String
        }
        `
      );

      // Create custom metadata directory
      await fs.ensureDir(path.join(testDir, 'custom-metadata', 'examples'));
      await fs.ensureDir(path.join(testDir, 'custom-metadata', 'errors'));

      // Create custom config
      const configPath = path.join(testDir, 'custom-config.json');
      await fs.writeJson(configPath, {
        metadataDir: './custom-metadata',
        outputDir: './docs',
        framework: 'docusaurus',
      });

      // Mock process.exit
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      await expect(
        runValidate({ config: 'custom-config.json', targetDir: testDir })
      ).rejects.toThrow('process.exit called');

      expect(mockExit).toHaveBeenCalledWith(0);
      mockExit.mockRestore();
    });
  });
});
