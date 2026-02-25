import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { buildPluginWatchTargets } from './run-generation.js';
import type { NormalizedGraphqlDocDocusaurusPluginOptions } from './options.js';

function createNormalizedOptions(
  overrides: Partial<NormalizedGraphqlDocDocusaurusPluginOptions> = {}
): NormalizedGraphqlDocDocusaurusPluginOptions {
  return {
    configPath: undefined,
    schema: undefined,
    outputDir: undefined,
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
});
