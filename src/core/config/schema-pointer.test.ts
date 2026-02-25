import { beforeEach, describe, expect, it, vi } from 'vitest';
import path from 'path';

const loadConfigMock = vi.hoisted(() => vi.fn());

vi.mock('graphql-config', () => ({
  loadConfig: loadConfigMock,
}));

import { resolveSchemaPointer, resolveSchemaPointers } from './schema-pointer.js';

describe('resolveSchemaPointers', () => {
  it('resolves relative file pointers against target dir', () => {
    const targetDir = '/repo';
    const resolved = resolveSchemaPointers('schema.graphql', targetDir);
    expect(resolved).toBe(path.resolve(targetDir, 'schema.graphql'));
  });

  it('keeps absolute file pointers unchanged', () => {
    const absolute = path.resolve('/repo', 'schema.graphql');
    expect(resolveSchemaPointers(absolute, '/another-root')).toBe(absolute);
  });

  it('keeps remote schema pointers unchanged', () => {
    const remote = 'https://example.com/graphql';
    expect(resolveSchemaPointers(remote, '/repo')).toBe(remote);
  });

  it('resolves each local pointer in an array', () => {
    const targetDir = '/repo';
    const resolved = resolveSchemaPointers(
      ['schema.graphql', '/opt/shared/schema.graphql', 'https://example.com/graphql'],
      targetDir
    );

    expect(resolved).toEqual([
      path.resolve(targetDir, 'schema.graphql'),
      '/opt/shared/schema.graphql',
      'https://example.com/graphql',
    ]);
  });
});

describe('resolveSchemaPointer', () => {
  beforeEach(() => {
    loadConfigMock.mockReset();
  });

  it('returns explicit schema option without consulting graphql-config', async () => {
    const schema = await resolveSchemaPointer({ schema: './schema.graphql' }, '/repo');
    expect(schema).toBe('./schema.graphql');
    expect(loadConfigMock).not.toHaveBeenCalled();
  });

  it('uses string schema from graphql-config default project', async () => {
    loadConfigMock.mockResolvedValue({
      getDefault: () => ({
        schema: './from-graphqlrc.graphql',
      }),
    });

    const log = vi.fn();
    const schema = await resolveSchemaPointer({}, '/repo', { log });

    expect(loadConfigMock).toHaveBeenCalledWith({ rootDir: '/repo' });
    expect(schema).toBe('./from-graphqlrc.graphql');
    expect(log).toHaveBeenCalledWith('Using schema from .graphqlrc: ./from-graphqlrc.graphql');
  });

  it('filters non-string array schema entries from graphql-config', async () => {
    loadConfigMock.mockResolvedValue({
      getDefault: () => ({
        schema: ['./schema-a.graphql', './schema-b.graphql', { ignored: true }] as unknown,
      }),
    });

    const schema = await resolveSchemaPointer({}, '/repo');
    expect(schema).toEqual(['./schema-a.graphql', './schema-b.graphql']);
  });

  it('falls back to schema.graphql when graphql-config is unavailable', async () => {
    loadConfigMock.mockRejectedValue(new Error('graphql-config not found'));
    const log = vi.fn();

    const schema = await resolveSchemaPointer({}, '/repo', { log });

    expect(schema).toBe('schema.graphql');
    expect(log).toHaveBeenCalledWith('No schema provided, using default: schema.graphql');
  });

  it('suppresses logging when silent mode is enabled', async () => {
    loadConfigMock.mockResolvedValue(null);
    const log = vi.fn();

    const schema = await resolveSchemaPointer({}, '/repo', { silent: true, log });

    expect(schema).toBe('schema.graphql');
    expect(log).not.toHaveBeenCalled();
  });
});
