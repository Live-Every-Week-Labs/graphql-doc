import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { SchemaValidator } from './schema-validator.js';

describe('SchemaValidator', () => {
  let testDir: string;
  let validator: SchemaValidator;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `schema-validator-test-${Date.now()}`);
    await fs.ensureDir(testDir);
    validator = new SchemaValidator();
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  describe('file handling', () => {
    it('returns error when schema file does not exist', async () => {
      const result = await validator.validate(path.join(testDir, 'nonexistent.graphql'));

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('SCHEMA_NOT_FOUND');
      expect(result.errors[0].severity).toBe('error');
      expect(result.operationNames).toEqual([]);
    });

    it('returns error when file cannot be read', async () => {
      // Create a directory with the same name as the schema file
      const schemaPath = path.join(testDir, 'schema.graphql');
      await fs.ensureDir(schemaPath);

      const result = await validator.validate(schemaPath);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('SCHEMA_LOAD_ERROR');
    });
  });

  describe('GraphQL syntax validation', () => {
    it('passes with valid GraphQL schema', async () => {
      const schemaPath = path.join(testDir, 'schema.graphql');
      await fs.writeFile(
        schemaPath,
        `
        type Query {
          hello: String
          users: [User]
        }

        type User {
          id: ID!
          name: String
        }
        `
      );

      const result = await validator.validate(schemaPath);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.operationNames).toContain('hello');
      expect(result.operationNames).toContain('users');
    });

    it('fails with invalid GraphQL syntax', async () => {
      const schemaPath = path.join(testDir, 'schema.graphql');
      await fs.writeFile(schemaPath, 'this is not valid graphql {{{');

      const result = await validator.validate(schemaPath);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('SCHEMA_PARSE_ERROR');
      expect(result.errors[0].line).toBe(1);
      expect(result.errors[0].column).toBe(1);
    });

    it('provides line and column for syntax errors', async () => {
      const schemaPath = path.join(testDir, 'schema.graphql');
      await fs.writeFile(
        schemaPath,
        `
        type Query {
          hello: String
          broken {
        }
        `
      );

      const result = await validator.validate(schemaPath);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('SCHEMA_PARSE_ERROR');
      expect(result.errors[0].line).toBeDefined();
      expect(result.errors[0].column).toBeDefined();
    });

    it('extracts operations from Query, Mutation, and Subscription', async () => {
      const schemaPath = path.join(testDir, 'schema.graphql');
      await fs.writeFile(
        schemaPath,
        `
        type Query {
          getUser: User
          listUsers: [User]
        }

        type Mutation {
          createUser: User
          deleteUser: Boolean
        }

        type Subscription {
          userCreated: User
        }

        type User {
          id: ID!
        }
        `
      );

      const result = await validator.validate(schemaPath);

      expect(result.valid).toBe(true);
      expect(result.operationNames).toHaveLength(5);
      expect(result.operationNames).toContain('getUser');
      expect(result.operationNames).toContain('listUsers');
      expect(result.operationNames).toContain('createUser');
      expect(result.operationNames).toContain('deleteUser');
      expect(result.operationNames).toContain('userCreated');
    });
  });

  describe('directive validation', () => {
    it('passes with valid @docGroup directive', async () => {
      const schemaPath = path.join(testDir, 'schema.graphql');
      await fs.writeFile(
        schemaPath,
        `
        directive @docGroup(name: String!, order: Int, subsection: String) on FIELD_DEFINITION

        type Query {
          users: [User] @docGroup(name: "Users", order: 1)
          admins: [User] @docGroup(name: "Users", order: 1, subsection: "Admin")
        }

        type User {
          id: ID!
        }
        `
      );

      const result = await validator.validate(schemaPath);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('captures docGroup and docIgnore metadata for operations', async () => {
      const schemaPath = path.join(testDir, 'schema.graphql');
      await fs.writeFile(
        schemaPath,
        `
        directive @docGroup(name: String!, order: Int, subsection: String) on FIELD_DEFINITION
        directive @docIgnore on FIELD_DEFINITION

        type Query {
          users: [User] @docGroup(name: "Users")
          internalHealth: String @docIgnore
        }

        type User {
          id: ID!
        }
        `
      );

      const result = await validator.validate(schemaPath);
      const users = result.operations.find((operation) => operation.name === 'users');
      const internalHealth = result.operations.find(
        (operation) => operation.name === 'internalHealth'
      );

      expect(users?.directives.docGroup?.name).toBe('Users');
      expect(internalHealth?.directives.docIgnore).toBe(true);
    });

    it('fails when @docGroup is missing required name argument', async () => {
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

      const result = await validator.validate(schemaPath);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('DIRECTIVE_MISSING_ARG');
      expect(result.errors[0].message).toContain('@docGroup');
      expect(result.errors[0].message).toContain('name');
    });

    it('passes with valid @docPriority directive', async () => {
      const schemaPath = path.join(testDir, 'schema.graphql');
      await fs.writeFile(
        schemaPath,
        `
        directive @docPriority(level: Int!) on FIELD_DEFINITION

        type Query {
          users: [User] @docPriority(level: 1)
        }

        type User {
          id: ID!
        }
        `
      );

      const result = await validator.validate(schemaPath);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('fails when @docPriority is missing required level argument', async () => {
      const schemaPath = path.join(testDir, 'schema.graphql');
      await fs.writeFile(
        schemaPath,
        `
        directive @docPriority(level: Int!) on FIELD_DEFINITION

        type Query {
          users: [User] @docPriority
        }

        type User {
          id: ID!
        }
        `
      );

      const result = await validator.validate(schemaPath);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('DIRECTIVE_MISSING_ARG');
      expect(result.errors[0].message).toContain('level');
    });

    it('passes with valid @docTags directive', async () => {
      const schemaPath = path.join(testDir, 'schema.graphql');
      await fs.writeFile(
        schemaPath,
        `
        directive @docTags(tags: [String!]!) on FIELD_DEFINITION

        type Query {
          users: [User] @docTags(tags: ["users", "read"])
        }

        type User {
          id: ID!
        }
        `
      );

      const result = await validator.validate(schemaPath);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('passes with @docIgnore directive', async () => {
      const schemaPath = path.join(testDir, 'schema.graphql');
      await fs.writeFile(
        schemaPath,
        `
        directive @docIgnore on FIELD_DEFINITION

        type Query {
          users: [User] @docIgnore
        }

        type User {
          id: ID!
        }
        `
      );

      const result = await validator.validate(schemaPath);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('fails when @docTags is missing required tags argument', async () => {
      const schemaPath = path.join(testDir, 'schema.graphql');
      await fs.writeFile(
        schemaPath,
        `
        directive @docTags(tags: [String!]!) on FIELD_DEFINITION

        type Query {
          users: [User] @docTags
        }

        type User {
          id: ID!
        }
        `
      );

      const result = await validator.validate(schemaPath);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('DIRECTIVE_MISSING_ARG');
      expect(result.errors[0].message).toContain('tags');
    });

    it('fails with invalid argument type for @docGroup order', async () => {
      const schemaPath = path.join(testDir, 'schema.graphql');
      await fs.writeFile(
        schemaPath,
        `
        directive @docGroup(name: String!, order: Int, subsection: String) on FIELD_DEFINITION

        type Query {
          users: [User] @docGroup(name: "Users", order: "not-a-number")
        }

        type User {
          id: ID!
        }
        `
      );

      const result = await validator.validate(schemaPath);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('DIRECTIVE_INVALID_ARG');
    });

    it('collects multiple directive errors', async () => {
      const schemaPath = path.join(testDir, 'schema.graphql');
      await fs.writeFile(
        schemaPath,
        `
        directive @docGroup(name: String!, order: Int, subsection: String) on FIELD_DEFINITION
        directive @docPriority(level: Int!) on FIELD_DEFINITION

        type Query {
          users: [User] @docGroup(name: "Users")
          admins: [User] @docPriority
        }

        type User {
          id: ID!
        }
        `
      );

      const result = await validator.validate(schemaPath);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors.some((e) => e.message.includes('level'))).toBe(true);
    });

    it('passes with multiple valid directives on same field', async () => {
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
        }
        `
      );

      const result = await validator.validate(schemaPath);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('includes line and column info for directive errors', async () => {
      const schemaPath = path.join(testDir, 'schema.graphql');
      await fs.writeFile(
        schemaPath,
        `directive @docTags(tags: [String!]!) on FIELD_DEFINITION

type Query {
  users: [User] @docTags
}

type User {
  id: ID!
}`
      );

      const result = await validator.validate(schemaPath);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].line).toBe(4);
      expect(result.errors[0].column).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('handles empty schema file', async () => {
      const schemaPath = path.join(testDir, 'schema.graphql');
      await fs.writeFile(schemaPath, '');

      const result = await validator.validate(schemaPath);

      // Empty schema is invalid GraphQL (parse error)
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('SCHEMA_PARSE_ERROR');
    });

    it('handles schema with only types (no operations)', async () => {
      const schemaPath = path.join(testDir, 'schema.graphql');
      await fs.writeFile(
        schemaPath,
        `
        type User {
          id: ID!
          name: String
        }
        `
      );

      const result = await validator.validate(schemaPath);

      expect(result.valid).toBe(true);
      expect(result.operationNames).toHaveLength(0);
    });

    it('ignores non-doc directives', async () => {
      const schemaPath = path.join(testDir, 'schema.graphql');
      await fs.writeFile(
        schemaPath,
        `
        directive @deprecated(reason: String) on FIELD_DEFINITION
        directive @customDirective(value: String) on FIELD_DEFINITION

        type Query {
          oldMethod: String @deprecated(reason: "Use newMethod")
          something: String @customDirective(value: "test")
        }
        `
      );

      const result = await validator.validate(schemaPath);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('handles schema with comments', async () => {
      const schemaPath = path.join(testDir, 'schema.graphql');
      await fs.writeFile(
        schemaPath,
        `
        # This is a comment
        """
        This is a description
        """
        type Query {
          # Get all users
          users: [User]
        }

        type User {
          id: ID!
        }
        `
      );

      const result = await validator.validate(schemaPath);

      expect(result.valid).toBe(true);
      expect(result.operationNames).toContain('users');
    });
  });
});
