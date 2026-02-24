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

  describe('remote schema SSRF protection', () => {
    const loader = new SchemaLoader();

    it('blocks remote URLs when allowRemoteSchema is false', async () => {
      await expect(
        loader.load({ schemaPointer: 'https://example.com/graphql', allowRemoteSchema: false })
      ).rejects.toThrow('Remote schema loading is disabled');
    });

    it('blocks localhost URLs', async () => {
      await expect(
        loader.load({ schemaPointer: 'https://localhost/graphql', allowRemoteSchema: true })
      ).rejects.toThrow('hostname "localhost" is not allowed');
    });

    it('blocks private IPv4 addresses (127.x)', async () => {
      await expect(
        loader.load({ schemaPointer: 'https://127.0.0.1/graphql', allowRemoteSchema: true })
      ).rejects.toThrow('resolves to a private/internal address');
    });

    it('blocks link-local / metadata IPs (169.254.x)', async () => {
      await expect(
        loader.load({
          schemaPointer: 'https://169.254.169.254/latest/meta-data',
          allowRemoteSchema: true,
        })
      ).rejects.toThrow('resolves to a private/internal address');
    });

    it('blocks private network IPs (10.x)', async () => {
      await expect(
        loader.load({ schemaPointer: 'https://10.0.0.1/graphql', allowRemoteSchema: true })
      ).rejects.toThrow('resolves to a private/internal address');
    });

    it('blocks private network IPs (192.168.x)', async () => {
      await expect(
        loader.load({ schemaPointer: 'https://192.168.1.1/graphql', allowRemoteSchema: true })
      ).rejects.toThrow('resolves to a private/internal address');
    });

    it('blocks private network IPs (172.16-31.x)', async () => {
      await expect(
        loader.load({ schemaPointer: 'https://172.16.0.1/graphql', allowRemoteSchema: true })
      ).rejects.toThrow('resolves to a private/internal address');
    });

    it('blocks metadata.google.internal', async () => {
      await expect(
        loader.load({
          schemaPointer: 'https://metadata.google.internal/graphql',
          allowRemoteSchema: true,
        })
      ).rejects.toThrow('is not allowed');
    });

    it('blocks IPv6-mapped private IPv4 addresses (::ffff:127.0.0.1)', async () => {
      await expect(
        loader.load({
          schemaPointer: 'https://[::ffff:127.0.0.1]/graphql',
          allowRemoteSchema: true,
        })
      ).rejects.toThrow('resolves to a private/internal address');
    });

    it('blocks IPv6-mapped private IPv4 addresses (::ffff:10.0.0.1)', async () => {
      await expect(
        loader.load({
          schemaPointer: 'https://[::ffff:10.0.0.1]/graphql',
          allowRemoteSchema: true,
        })
      ).rejects.toThrow('resolves to a private/internal address');
    });

    it('blocks IPv6-mapped private IPv4 addresses (::ffff:192.168.1.1)', async () => {
      await expect(
        loader.load({
          schemaPointer: 'https://[::ffff:192.168.1.1]/graphql',
          allowRemoteSchema: true,
        })
      ).rejects.toThrow('resolves to a private/internal address');
    });
  });
});
