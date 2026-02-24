import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { runValidate } from './validate.js';

describe('validate command', () => {
  let testDir: string;

  beforeEach(async () => {
    // Create a temporary directory for testing
    testDir = path.join(os.tmpdir(), `graphql-doc-validate-test-${Date.now()}`);
    await fs.ensureDir(testDir);
  });

  afterEach(async () => {
    // Clean up test directory
    await fs.remove(testDir);

    // Clear all mocks
    vi.clearAllMocks();
  });

  describe('schema validation', () => {
    it('throws when schema file is not found', async () => {
      await expect(
        runValidate({ schema: 'nonexistent.graphql', targetDir: testDir })
      ).rejects.toThrow('Validation failed');
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

      // Create required metadata directory (empty)
      await fs.ensureDir(path.join(testDir, 'docs-metadata', 'examples'));

      // Should resolve without throwing
      await expect(runValidate({ targetDir: testDir })).resolves.toBeUndefined();
    });

    it('throws with invalid GraphQL syntax', async () => {
      // Create an invalid schema
      const schemaPath = path.join(testDir, 'schema.graphql');
      await fs.writeFile(schemaPath, 'this is not valid graphql {{{');

      await expect(runValidate({ targetDir: testDir })).rejects.toThrow('Validation failed');
    });

    it('passes with valid custom directives', async () => {
      // Create a schema with valid custom directives
      const schemaPath = path.join(testDir, 'schema.graphql');
      await fs.writeFile(
        schemaPath,
        `
        directive @docGroup(name: String!, order: Int, subsection: String) on FIELD_DEFINITION
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

      // Create required metadata directory
      await fs.ensureDir(path.join(testDir, 'docs-metadata', 'examples'));

      // Should resolve without throwing
      await expect(runValidate({ targetDir: testDir })).resolves.toBeUndefined();
    });

    it('throws when directive is missing required arguments', async () => {
      // Create a schema with missing directive arguments
      const schemaPath = path.join(testDir, 'schema.graphql');
      await fs.writeFile(
        schemaPath,
        `
        directive @docGroup(name: String!, order: Int, subsection: String) on FIELD_DEFINITION

        type Query {
          users: [User] @docGroup(order: 1)
        }

        type User {
          id: ID!
        }
        `
      );

      // Create required metadata directory
      await fs.ensureDir(path.join(testDir, 'docs-metadata', 'examples'));

      await expect(runValidate({ targetDir: testDir })).rejects.toThrow('Validation failed');
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

      // Should resolve without throwing
      await expect(runValidate({ targetDir: testDir })).resolves.toBeUndefined();
    });

    it('throws with invalid example JSON', async () => {
      // Create directories
      await fs.ensureDir(path.join(testDir, 'docs-metadata', 'examples'));

      // Create invalid JSON file
      const examplePath = path.join(testDir, 'docs-metadata', 'examples', 'invalid.json');
      await fs.writeFile(examplePath, '{ invalid json }');

      await expect(runValidate({ targetDir: testDir })).rejects.toThrow('Validation failed');
    });

    it('throws with missing required fields in example', async () => {
      // Create directories
      await fs.ensureDir(path.join(testDir, 'docs-metadata', 'examples'));

      // Create example file missing required fields
      const examplePath = path.join(testDir, 'docs-metadata', 'examples', 'incomplete.json');
      await fs.writeJson(examplePath, {
        operation: 'getUser',
        // Missing operationType and examples
      });

      await expect(runValidate({ targetDir: testDir })).rejects.toThrow('Validation failed');
    });

    it('throws when required example coverage is enabled and documented operations are missing examples', async () => {
      await fs.ensureDir(path.join(testDir, 'docs-metadata', 'examples'));

      const configPath = path.join(testDir, 'require-examples.json');
      await fs.writeJson(configPath, {
        outputDir: './docs',
        framework: 'docusaurus',
        metadataDir: './docs-metadata',
        requireExamplesForDocumentedOperations: true,
      });

      await expect(
        runValidate({ config: 'require-examples.json', targetDir: testDir })
      ).rejects.toThrow('Validation failed');
    });
  });

  describe('cross-validation', () => {
    beforeEach(async () => {
      // Create directories
      await fs.ensureDir(path.join(testDir, 'docs-metadata', 'examples'));
    });

    it('passes with warnings when example references unknown operation', async () => {
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

      // Without --strict, should succeed (warnings only)
      await expect(runValidate({ targetDir: testDir })).resolves.toBeUndefined();
    });

    it('throws in strict mode with warnings', async () => {
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

      // With --strict, should throw (warnings treated as errors)
      await expect(runValidate({ targetDir: testDir, strict: true })).rejects.toThrow(
        'Validation failed'
      );
    });
  });

  describe('CLI options', () => {
    beforeEach(async () => {
      // Create directories
      await fs.ensureDir(path.join(testDir, 'docs-metadata', 'examples'));
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

      // Should resolve without throwing
      await expect(
        runValidate({ schema: 'graphql/custom.graphql', targetDir: testDir })
      ).resolves.toBeUndefined();
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

      // Create custom config
      const configPath = path.join(testDir, 'custom-config.json');
      await fs.writeJson(configPath, {
        metadataDir: './custom-metadata',
        outputDir: './docs',
        framework: 'docusaurus',
      });

      // Should resolve without throwing
      await expect(
        runValidate({ config: 'custom-config.json', targetDir: testDir })
      ).resolves.toBeUndefined();
    });

    it('supports exampleFiles arrays from config', async () => {
      const schemaPath = path.join(testDir, 'schema.graphql');
      await fs.writeFile(
        schemaPath,
        `
        type Query {
          getUser: String
        }
        `
      );

      await fs.ensureDir(path.join(testDir, 'metadata-a'));
      await fs.ensureDir(path.join(testDir, 'metadata-b'));

      await fs.writeJson(path.join(testDir, 'metadata-a', 'queries.json'), {
        operation: 'getUser',
        operationType: 'query',
        examples: [
          {
            name: 'Example',
            query: 'query { getUser }',
            response: {
              type: 'success',
              httpStatus: 200,
              body: {},
            },
          },
        ],
      });

      const configPath = path.join(testDir, 'custom-examples-config.json');
      await fs.writeJson(configPath, {
        outputDir: './docs',
        framework: 'docusaurus',
        metadataDir: './docs-metadata',
        exampleFiles: ['./metadata-a/*.json', './metadata-b/*.json'],
      });

      // Should resolve without throwing
      await expect(
        runValidate({ config: 'custom-examples-config.json', targetDir: testDir })
      ).resolves.toBeUndefined();
    });
  });

  describe('output modes', () => {
    it('emits JSON output on successful validation', async () => {
      await fs.writeFile(
        path.join(testDir, 'schema.graphql'),
        `
        type Query {
          ok: String
        }
        `
      );
      await fs.ensureDir(path.join(testDir, 'docs-metadata', 'examples'));

      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      let payload: { success: boolean; schemaValid: boolean } = {
        success: false,
        schemaValid: false,
      };
      try {
        await expect(runValidate({ targetDir: testDir, json: true })).resolves.toBeUndefined();
        const lastCall = logSpy.mock.calls.at(-1)?.[0];
        payload = JSON.parse(String(lastCall));
      } finally {
        logSpy.mockRestore();
      }

      expect(payload.success).toBe(true);
      expect(payload.schemaValid).toBe(true);
    });

    it('emits JSON output on validation failure', async () => {
      await fs.ensureDir(path.join(testDir, 'docs-metadata', 'examples'));

      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      let payload: { success: boolean; errors: unknown[] } = { success: false, errors: [] };
      try {
        await expect(
          runValidate({ schema: 'missing.graphql', targetDir: testDir, json: true })
        ).rejects.toThrow('Validation failed');
        const lastCall = logSpy.mock.calls.at(-1)?.[0];
        payload = JSON.parse(String(lastCall));
      } finally {
        logSpy.mockRestore();
      }

      expect(payload.success).toBe(false);
      expect(payload.errors.length).toBeGreaterThan(0);
    });

    it('throws when both verbose and quiet flags are used together', async () => {
      await expect(runValidate({ targetDir: testDir, verbose: true, quiet: true })).rejects.toThrow(
        '--verbose and --quiet cannot be used together'
      );
    });
  });
});
