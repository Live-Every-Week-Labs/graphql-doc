import { describe, it, expect } from 'vitest';
import { normalizePluginOptions, validateOptions, validatePluginOptions } from './options.js';

describe('docusaurus plugin options', () => {
  it('normalizes deterministic defaults', () => {
    const normalized = normalizePluginOptions();

    expect(normalized).toEqual({
      id: undefined,
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
    });
  });

  it('preserves explicit runtime overrides', () => {
    const normalized = normalizePluginOptions({
      configPath: './graphql-doc.config.json',
      schema: ['./schema.graphql', './schema.extensions.graphql'],
      outputDir: './docs/generated-api',
      target: 'labs',
      allTargets: false,
      watch: true,
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
        requestDetection: {
          acceptTypes: ['text/markdown'],
          headerNames: ['x-doc-format'],
          headerValues: ['markdown'],
        },
        docsSourceFallback: {
          enabled: true,
          docsBasePaths: ['/docs', '/guides'],
          metadataBaseDir: './.docusaurus/docusaurus-plugin-content-docs',
          docsPluginIds: ['default', 'api'],
          cacheTtlMs: 5000,
        },
      },
      verbose: true,
    });

    expect(normalized.configPath).toBe('./graphql-doc.config.json');
    expect(normalized.schema).toEqual(['./schema.graphql', './schema.extensions.graphql']);
    expect(normalized.outputDir).toBe('./docs/generated-api');
    expect(normalized.target).toBe('labs');
    expect(normalized.allTargets).toBe(false);
    expect(normalized.watch).toBe(true);
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
      requestDetection: {
        acceptTypes: ['text/markdown'],
        headerNames: ['x-doc-format'],
        headerValues: ['markdown'],
      },
      docsSourceFallback: {
        enabled: true,
        docsBasePaths: ['/docs', '/guides'],
        metadataBaseDir: './.docusaurus/docusaurus-plugin-content-docs',
        docsPluginIds: ['default', 'api'],
        cacheTtlMs: 5000,
      },
    });
    expect(normalized.verbose).toBe(true);
    expect(normalized.quiet).toBe(false);
  });

  it('preserves markdown redirect defaults when only enabled is overridden', () => {
    const normalized = normalizePluginOptions({
      markdownRedirect: {
        enabled: false,
      },
    });

    expect(normalized.markdownRedirect).toEqual({
      enabled: false,
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
    });
  });

  it('preserves schema arrays exactly as provided', () => {
    const normalized = normalizePluginOptions({
      schema: ['./schema.graphql', './schema.extensions.graphql'],
    });

    expect(normalized.schema).toEqual(['./schema.graphql', './schema.extensions.graphql']);
  });

  it('rejects verbose and quiet together', () => {
    const normalized = normalizePluginOptions({ verbose: true, quiet: true });
    expect(() => validatePluginOptions(normalized)).toThrow(
      'verbose and quiet cannot both be true'
    );
  });

  it('rejects target and allTargets when both are set', () => {
    const normalized = normalizePluginOptions({ target: 'labs', allTargets: true });
    expect(() => validatePluginOptions(normalized)).toThrow(
      'target and allTargets cannot both be set'
    );
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

  it('rejects an empty markdown request-detection accept type list', () => {
    const normalized = normalizePluginOptions({
      markdownRedirect: {
        requestDetection: {
          acceptTypes: [],
        },
      },
    });

    expect(() => validatePluginOptions(normalized)).toThrow(
      'markdownRedirect.requestDetection.acceptTypes must contain at least one value'
    );
  });

  it('rejects empty docs fallback base paths when fallback is enabled', () => {
    const normalized = normalizePluginOptions({
      markdownRedirect: {
        docsSourceFallback: {
          enabled: true,
          docsBasePaths: [],
        },
      },
    });

    expect(() => validatePluginOptions(normalized)).toThrow(
      'markdownRedirect.docsSourceFallback.docsBasePaths must contain at least one value'
    );
  });

  it('rejects negative docs fallback cache ttl values', () => {
    const normalized = normalizePluginOptions({
      markdownRedirect: {
        docsSourceFallback: {
          cacheTtlMs: -1,
        },
      },
    });

    expect(() => validatePluginOptions(normalized)).toThrow(
      'markdownRedirect.docsSourceFallback.cacheTtlMs must be a non-negative number'
    );
  });

  it('exports a docusaurus validateOptions hook', () => {
    const options = {
      outputDir: './docs/api',
      llmDocs: true,
    };

    const validated = validateOptions({
      options,
      validate: (() => options) as never,
    });

    expect(validated).toEqual({
      id: 'default',
      ...options,
    });
  });

  it('throws a ValidationError for invalid docusaurus options', () => {
    expect(() =>
      validateOptions({
        options: {
          verbose: true,
          quiet: true,
        },
        validate: (() => ({})) as never,
      })
    ).toThrowError(
      expect.objectContaining({
        name: 'ValidationError',
      })
    );
  });
});
