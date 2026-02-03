import { describe, it, expect } from 'vitest';
import { SchemaLoader } from './schema-loader';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const simpleSchemaPath = path.join(__dirname, '../../../tests/fixtures/schemas/simple.graphql');
const extensionSchemaPath = path.join(
  __dirname,
  '../../../tests/fixtures/schemas/extension.graphql'
);
const usesExtensionSchemaPath = path.join(
  __dirname,
  '../../../tests/fixtures/schemas/uses-extension.graphql'
);

describe('SchemaLoader', () => {
  it('should load schema from a file', async () => {
    const loader = new SchemaLoader();
    const schema = await loader.load({ schemaPointer: simpleSchemaPath });

    expect(schema).toBeDefined();
    const queryType = schema.getQueryType();
    expect(queryType).toBeDefined();
    expect(queryType?.getFields()['hello']).toBeDefined();
  });

  it('should throw error for non-existent file', async () => {
    const loader = new SchemaLoader();
    await expect(loader.load({ schemaPointer: 'non-existent.graphql' })).rejects.toThrow();
  });

  it('should load schema with extensions', async () => {
    const loader = new SchemaLoader();
    const schema = await loader.load({
      schemaPointer: usesExtensionSchemaPath,
      schemaExtensions: [extensionSchemaPath],
    });

    expect(schema).toBeDefined();
    const queryType = schema.getQueryType();
    expect(queryType?.getFields()['now']).toBeDefined();
  });
});
