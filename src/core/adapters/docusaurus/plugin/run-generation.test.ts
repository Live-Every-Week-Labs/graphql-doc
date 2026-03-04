import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildSchema } from 'graphql';
import { buildPluginWatchTargets, runPluginGeneration } from './run-generation.js';
import type { NormalizedGraphqlDocDocusaurusPluginOptions } from './options.js';

const TEST_SCHEMA = 'type Query { ping: String! }';

// Avoid graphql module-instance mismatches in plugin runtime tests by
// short-circuiting schema loading to a deterministic in-memory schema.
// The fallback behavior is still exercised by throwing when the pointer
// contains "missing.graphql".
vi.mock('../../../parser/schema-loader.js', () => ({
  SchemaLoader: class {
    async load({ schemaPointer }: { schemaPointer: string | string[] }) {
      const pointers = Array.isArray(schemaPointer) ? schemaPointer : [schemaPointer];
      if (pointers.some((pointer) => pointer.includes('missing.graphql'))) {
        throw new Error('Primary schema is unavailable');
      }

      return buildSchema(TEST_SCHEMA);
    }
  },
}));

function createNormalizedOptions(
  overrides: Partial<NormalizedGraphqlDocDocusaurusPluginOptions> = {}
): NormalizedGraphqlDocDocusaurusPluginOptions {
  return {
    configPath: undefined,
    schema: undefined,
    outputDir: undefined,
    target: undefined,
    allTargets: false,
    watch: false,
    cleanOutput: undefined,
    llmDocs: true,
    llmDocsStrategy: undefined,
    llmDocsDepth: undefined,
    llmExamples: true,
    markdownRedirect: {
      enabled: true,
      docsBasePath: '/docs/api',
      llmDocsPath: '/llm-docs',
      staticDir: undefined,
      requestDetection: {
        acceptTypes: ['text/markdown', 'text/x-markdown'],
        headerNames: [
          'x-accept-markdown',
          'x-doc-format',
          'x-format',
          'x-response-format',
          'x-return-format',
        ],
        headerValues: ['1', 'true', 'markdown', 'md', 'text/markdown'],
      },
      docsSourceFallback: {
        enabled: true,
        docsBasePaths: ['/docs'],
        metadataBaseDir: '.docusaurus/docusaurus-plugin-content-docs',
        docsPluginIds: ['default'],
        cacheTtlMs: 2000,
      },
    },
    verbose: false,
    quiet: false,
    ...overrides,
  };
}

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  tempDirs.length = 0;
});

describe('buildPluginWatchTargets', () => {
  it('returns local schema and config watch targets', () => {
    const siteDir = fs.mkdtempSync(path.join(os.tmpdir(), 'graphql-doc-watch-targets-'));
    tempDirs.push(siteDir);

    fs.writeFileSync(path.join(siteDir, 'schema.graphql'), 'type Query { ping: String! }');
    fs.writeFileSync(path.join(siteDir, 'graphql-doc.config.json'), '{"outputDir":"./docs/api"}');
    fs.mkdirSync(path.join(siteDir, 'docs-metadata'), { recursive: true });

    const targets = buildPluginWatchTargets(
      siteDir,
      createNormalizedOptions({
        schema: './schema.graphql',
        configPath: './graphql-doc.config.json',
      })
    );

    expect(targets).toEqual(
      expect.arrayContaining([
        path.join(siteDir, 'schema.graphql'),
        path.join(siteDir, 'graphql-doc.config.json'),
        path.join(siteDir, 'docs-metadata'),
      ])
    );
  });

  it('skips remote schemas and still returns local config/metadata targets', () => {
    const siteDir = fs.mkdtempSync(path.join(os.tmpdir(), 'graphql-doc-watch-targets-'));
    tempDirs.push(siteDir);

    fs.writeFileSync(path.join(siteDir, '.graphqlrc'), 'schema: ./schema.graphql');
    fs.mkdirSync(path.join(siteDir, 'docs-metadata'), { recursive: true });

    const targets = buildPluginWatchTargets(
      siteDir,
      createNormalizedOptions({
        schema: 'https://example.com/schema.graphql',
      })
    );

    expect(targets).toContain(path.join(siteDir, '.graphqlrc'));
    expect(targets).toContain(path.join(siteDir, 'docs-metadata'));
    expect(targets.find((entry) => entry.includes('example.com'))).toBeUndefined();
  });

  it('adds schema and metadata paths defined in loaded config files', () => {
    const siteDir = fs.mkdtempSync(path.join(os.tmpdir(), 'graphql-doc-watch-targets-'));
    tempDirs.push(siteDir);

    fs.mkdirSync(path.join(siteDir, 'schemas'), { recursive: true });
    fs.writeFileSync(path.join(siteDir, 'schemas', 'api.graphql'), 'type Query { ping: String! }');
    fs.mkdirSync(path.join(siteDir, 'docs-metadata', 'examples'), { recursive: true });
    fs.mkdirSync(path.join(siteDir, 'docs-metadata', 'errors'), { recursive: true });
    fs.writeFileSync(
      path.join(siteDir, '.graphqlrc'),
      [
        'schema: ./schemas/api.graphql',
        'extensions:',
        '  graphql-doc:',
        '    examples:',
        '      dir: ./docs-metadata/examples',
        '    errors:',
        '      dir: ./docs-metadata/errors',
        '',
      ].join('\n')
    );

    const targets = buildPluginWatchTargets(siteDir, createNormalizedOptions());

    expect(targets).toEqual(
      expect.arrayContaining([
        path.join(siteDir, '.graphqlrc'),
        path.join(siteDir, 'schemas', 'api.graphql'),
        path.join(siteDir, 'docs-metadata', 'examples'),
        path.join(siteDir, 'docs-metadata', 'errors'),
      ])
    );
  });

  it('includes target schema pointers discovered from config targets', () => {
    const siteDir = fs.mkdtempSync(path.join(os.tmpdir(), 'graphql-doc-watch-targets-'));
    tempDirs.push(siteDir);

    fs.mkdirSync(path.join(siteDir, 'schemas'), { recursive: true });
    fs.writeFileSync(path.join(siteDir, 'schemas', 'prod.graphql'), 'type Query { ping: String! }');
    fs.writeFileSync(path.join(siteDir, 'schemas', 'beta.graphql'), 'type Query { pong: String! }');
    fs.mkdirSync(path.join(siteDir, 'docs-metadata'), { recursive: true });
    fs.writeFileSync(
      path.join(siteDir, 'graphql-doc.config.json'),
      JSON.stringify({
        configVersion: 1,
        outputDir: './docs/api',
        framework: 'docusaurus',
        targets: [
          {
            name: 'prod',
            schema: './schemas/prod.graphql',
          },
          {
            name: 'labs',
            schema: {
              primary: './schemas/beta.graphql',
              fallback: './schemas/prod.graphql',
            },
          },
        ],
      })
    );

    const targets = buildPluginWatchTargets(
      siteDir,
      createNormalizedOptions({
        configPath: './graphql-doc.config.json',
      })
    );

    expect(targets).toEqual(
      expect.arrayContaining([
        path.join(siteDir, 'schemas', 'prod.graphql'),
        path.join(siteDir, 'schemas', 'beta.graphql'),
      ])
    );
  });

  it('filters remote schema pointers discovered from config while keeping local metadata paths', () => {
    const siteDir = fs.mkdtempSync(path.join(os.tmpdir(), 'graphql-doc-watch-targets-'));
    tempDirs.push(siteDir);

    fs.mkdirSync(path.join(siteDir, 'docs-metadata', 'examples'), { recursive: true });
    fs.writeFileSync(
      path.join(siteDir, '.graphqlrc'),
      [
        'schema: https://example.com/schema.graphql',
        'extensions:',
        '  graphql-doc:',
        '    examplesDir: ./docs-metadata/examples',
        '',
      ].join('\n')
    );

    const targets = buildPluginWatchTargets(siteDir, createNormalizedOptions());

    expect(targets.find((entry) => entry.includes('example.com'))).toBeUndefined();
    expect(targets).toContain(path.join(siteDir, 'docs-metadata', 'examples'));
  });

  it('does not crash watch target resolution when config parsing fails', () => {
    const siteDir = fs.mkdtempSync(path.join(os.tmpdir(), 'graphql-doc-watch-targets-'));
    tempDirs.push(siteDir);

    fs.writeFileSync(path.join(siteDir, '.graphqlrc'), 'schema: [');
    fs.mkdirSync(path.join(siteDir, 'docs-metadata'), { recursive: true });

    const targets = buildPluginWatchTargets(siteDir, createNormalizedOptions());

    expect(targets).toContain(path.join(siteDir, '.graphqlrc'));
    expect(targets).toContain(path.join(siteDir, 'docs-metadata'));
  });

  it('handles missing configPath files gracefully', () => {
    const siteDir = fs.mkdtempSync(path.join(os.tmpdir(), 'graphql-doc-watch-targets-'));
    tempDirs.push(siteDir);

    fs.mkdirSync(path.join(siteDir, 'docs-metadata'), { recursive: true });

    const targets = buildPluginWatchTargets(
      siteDir,
      createNormalizedOptions({
        configPath: './missing.config.json',
      })
    );

    expect(targets).toContain(siteDir);
    expect(targets).toContain(path.join(siteDir, 'docs-metadata'));
  });

  it('returns each local schema when schema option is an array', () => {
    const siteDir = fs.mkdtempSync(path.join(os.tmpdir(), 'graphql-doc-watch-targets-'));
    tempDirs.push(siteDir);

    fs.writeFileSync(path.join(siteDir, 'schema.graphql'), 'type Query { ping: String! }');
    fs.writeFileSync(path.join(siteDir, 'schema.extensions.graphql'), 'scalar DateTime');
    fs.mkdirSync(path.join(siteDir, 'docs-metadata'), { recursive: true });

    const targets = buildPluginWatchTargets(
      siteDir,
      createNormalizedOptions({
        schema: ['./schema.graphql', './schema.extensions.graphql'],
      })
    );

    expect(targets).toEqual(
      expect.arrayContaining([
        path.join(siteDir, 'schema.graphql'),
        path.join(siteDir, 'schema.extensions.graphql'),
      ])
    );
  });

  it('walks missing config metadata directories up to the nearest existing parent', () => {
    const siteDir = fs.mkdtempSync(path.join(os.tmpdir(), 'graphql-doc-watch-targets-'));
    tempDirs.push(siteDir);

    fs.mkdirSync(path.join(siteDir, 'docs-metadata'), { recursive: true });
    fs.writeFileSync(
      path.join(siteDir, '.graphqlrc'),
      [
        'schema: ./schema.graphql',
        'extensions:',
        '  graphql-doc:',
        '    examplesDir: ./docs-metadata/missing/examples',
        '',
      ].join('\n')
    );

    const targets = buildPluginWatchTargets(siteDir, createNormalizedOptions());

    expect(targets).toContain(path.join(siteDir, '.graphqlrc'));
    expect(targets).toContain(path.join(siteDir, 'docs-metadata'));
  });
});

describe('runPluginGeneration', () => {
  it('runs only the selected configured target', async () => {
    const siteDir = fs.mkdtempSync(path.join(os.tmpdir(), 'graphql-doc-plugin-run-'));
    tempDirs.push(siteDir);

    fs.mkdirSync(path.join(siteDir, 'schemas'), { recursive: true });
    fs.writeFileSync(
      path.join(siteDir, 'schemas', 'prod.graphql'),
      'type Query { ping: String! }',
      'utf-8'
    );
    fs.writeFileSync(
      path.join(siteDir, 'schemas', 'beta.graphql'),
      'type Query { pong: String! }',
      'utf-8'
    );
    fs.writeFileSync(
      path.join(siteDir, 'graphql-doc.config.json'),
      JSON.stringify({
        configVersion: 1,
        outputDir: './docs/api',
        framework: 'docusaurus',
        targets: [
          {
            name: 'prod',
            schema: './schemas/prod.graphql',
            outputDir: './docs/api',
          },
          {
            name: 'labs',
            schema: './schemas/beta.graphql',
            outputDir: './versioned_docs/version-labs/api',
            llmDocs: {
              enabled: false,
            },
          },
        ],
      }),
      'utf-8'
    );

    const result = await runPluginGeneration({
      siteDir,
      options: createNormalizedOptions({
        configPath: './graphql-doc.config.json',
        target: 'labs',
        llmDocs: false,
      }),
    });

    expect(result.targetResults).toHaveLength(1);
    expect(result.targetResults[0].targetName).toBe('labs');
    expect(result.filesWritten).toBeGreaterThan(0);
    expect(fs.existsSync(path.join(siteDir, 'versioned_docs', 'version-labs', 'api'))).toBe(true);
    expect(fs.existsSync(path.join(siteDir, 'docs', 'api'))).toBe(false);
  });

  it('falls back to secondary schema pointer when primary schema fails', async () => {
    const siteDir = fs.mkdtempSync(path.join(os.tmpdir(), 'graphql-doc-plugin-run-'));
    tempDirs.push(siteDir);

    fs.mkdirSync(path.join(siteDir, 'schemas'), { recursive: true });
    fs.writeFileSync(
      path.join(siteDir, 'schemas', 'prod.graphql'),
      'type Query { ping: String! }',
      'utf-8'
    );
    fs.writeFileSync(
      path.join(siteDir, 'graphql-doc.config.json'),
      JSON.stringify({
        configVersion: 1,
        outputDir: './docs/api',
        framework: 'docusaurus',
        targets: [
          {
            name: 'labs',
            schema: {
              primary: './schemas/missing.graphql',
              fallback: './schemas/prod.graphql',
            },
            outputDir: './versioned_docs/version-labs/api',
            llmDocs: {
              enabled: false,
            },
          },
        ],
      }),
      'utf-8'
    );

    const result = await runPluginGeneration({
      siteDir,
      options: createNormalizedOptions({
        configPath: './graphql-doc.config.json',
        target: 'labs',
        llmDocs: false,
      }),
    });

    expect(result.targetResults).toHaveLength(1);
    expect(result.targetResults[0].schemaPointer).toBe(
      path.join(siteDir, 'schemas', 'prod.graphql')
    );
    expect(fs.existsSync(path.join(siteDir, 'versioned_docs', 'version-labs', 'api'))).toBe(true);
  });
});
