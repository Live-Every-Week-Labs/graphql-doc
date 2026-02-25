import { describe, it, expect } from 'vitest';
import { normalizePluginOptions, validatePluginOptions } from './options.js';

describe('docusaurus plugin options', () => {
  it('normalizes deterministic defaults', () => {
    const normalized = normalizePluginOptions();

    expect(normalized).toEqual({
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
      watch: false,
      verbose: false,
      quiet: false,
    });
  });

  it('preserves explicit runtime overrides', () => {
    const normalized = normalizePluginOptions({
      configPath: './graphql-doc.config.json',
      schema: ['./schema.graphql', './schema.extensions.graphql'],
      outputDir: './docs/generated-api',
      cleanOutput: true,
      llmDocs: false,
      llmDocsStrategy: 'single',
      llmDocsDepth: 4,
      llmExamples: false,
      markdownRedirect: {
        enabled: false,
        docsBasePath: '/docs/custom',
        llmDocsPath: '/raw-api',
        staticDir: './public-static',
      },
      verbose: true,
    });

    expect(normalized.configPath).toBe('./graphql-doc.config.json');
    expect(normalized.schema).toEqual(['./schema.graphql', './schema.extensions.graphql']);
    expect(normalized.outputDir).toBe('./docs/generated-api');
    expect(normalized.cleanOutput).toBe(true);
    expect(normalized.llmDocs).toBe(false);
    expect(normalized.llmDocsStrategy).toBe('single');
    expect(normalized.llmDocsDepth).toBe(4);
    expect(normalized.llmExamples).toBe(false);
    expect(normalized.markdownRedirect).toEqual({
      enabled: false,
      docsBasePath: '/docs/custom',
      llmDocsPath: '/raw-api',
      staticDir: './public-static',
    });
    expect(normalized.verbose).toBe(true);
    expect(normalized.quiet).toBe(false);
  });

  it('rejects verbose and quiet together', () => {
    const normalized = normalizePluginOptions({ verbose: true, quiet: true });
    expect(() => validatePluginOptions(normalized)).toThrow(
      'verbose and quiet cannot both be true'
    );
  });

  it('rejects watch mode until plugin watcher support exists', () => {
    const normalized = normalizePluginOptions({ watch: true });
    expect(() => validatePluginOptions(normalized)).toThrow('does not support watch mode yet');
  });

  it('rejects an empty markdown redirect docs base path', () => {
    const normalized = normalizePluginOptions({
      markdownRedirect: {
        docsBasePath: '   ',
      },
    });

    expect(() => validatePluginOptions(normalized)).toThrow(
      'markdownRedirect.docsBasePath is empty'
    );
  });

  it('rejects an empty markdown redirect llm docs path', () => {
    const normalized = normalizePluginOptions({
      markdownRedirect: {
        llmDocsPath: '',
      },
    });

    expect(() => validatePluginOptions(normalized)).toThrow(
      'markdownRedirect.llmDocsPath is empty'
    );
  });
});
