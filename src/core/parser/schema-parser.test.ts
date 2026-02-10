import { describe, it, expect } from 'vitest';
import { SchemaParser } from './schema-parser';
import { buildSchema } from 'graphql';

describe('SchemaParser', () => {
  const parser = new SchemaParser();

  it('should extract queries and mutations', () => {
    const sdl = `
      type Query {
        hello: String
      }
      type Mutation {
        createSomething(name: String!): String
      }
    `;
    const schema = buildSchema(sdl);
    const result = parser.parse(schema);
    const operations = result.operations;
    expect(result.warnings).toHaveLength(0);

    expect(operations).toHaveLength(2);

    const query = operations.find((op) => op.name === 'hello');
    expect(query).toBeDefined();
    expect(query?.operationType).toBe('query');
    expect(query?.returnType).toBe('String');

    const mutation = operations.find((op) => op.name === 'createSomething');
    expect(mutation).toBeDefined();
    expect(mutation?.operationType).toBe('mutation');
    expect(mutation?.arguments).toHaveLength(1);
    expect(mutation?.arguments[0].name).toBe('name');
    expect(mutation?.arguments[0].isRequired).toBe(true);
  });

  it('should extract directives', () => {
    const sdl = `
      directive @docGroup(name: String!, order: Int!) on FIELD_DEFINITION

      type Query {
        users: [String] @docGroup(name: "Users", order: 1)
      }
    `;
    const schema = buildSchema(sdl);
    const result = parser.parse(schema);
    const operations = result.operations;
    expect(result.warnings).toHaveLength(0);

    const query = operations.find((op) => op.name === 'users');
    expect(query).toBeDefined();
    expect(query?.directives.docGroup).toEqual({
      name: 'Users',
      order: 1,
    });
  });

  it('should handle descriptions', () => {
    const sdl = `
      type Query {
        "Returns hello"
        hello: String
      }
    `;
    const schema = buildSchema(sdl);
    const result = parser.parse(schema);
    const operations = result.operations;
    expect(result.warnings).toHaveLength(0);

    const query = operations.find((op) => op.name === 'hello');
    expect(query?.description).toBe('Returns hello');
  });

  it('collects parser warnings for invalid directives', () => {
    const sdl = `
      directive @docPriority(level: Int!) on FIELD_DEFINITION
      type Query {
        users: [String] @docPriority(level: "high")
      }
    `;
    const schema = buildSchema(sdl);
    const result = parser.parse(schema);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0].message).toContain('Invalid @docPriority usage:');
  });
});
