import { beforeEach, describe, expect, it, vi } from 'vitest';

const runPluginGenerationMock = vi.hoisted(() => vi.fn());
const createMarkdownRedirectWebpackConfigMock = vi.hoisted(() => vi.fn());

vi.mock('./run-generation.js', () => ({
  runPluginGeneration: runPluginGenerationMock,
}));

vi.mock('./markdown-redirect.js', () => ({
  createMarkdownRedirectWebpackConfig: createMarkdownRedirectWebpackConfigMock,
}));

import graphqlDocDocusaurusPlugin from './index.js';

describe('graphqlDocDocusaurusPlugin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exposes the expected plugin name', () => {
    const plugin = graphqlDocDocusaurusPlugin({ siteDir: '/repo' });
    expect(plugin.name).toBe('graphql-doc-docusaurus-plugin');
  });

  it('runs generation from loadContent once per lifecycle', async () => {
    const generationResult = {
      schemaPointer: '/repo/schema.graphql',
      outputDir: '/repo/docs/api',
      llmOutputDir: '/repo/static/llm-docs',
      filesWritten: 12,
      llmFilesWritten: 4,
    };
    runPluginGenerationMock.mockResolvedValue(generationResult);

    const plugin = graphqlDocDocusaurusPlugin(
      { siteDir: '/repo' },
      {
        schema: './schema.graphql',
      }
    );

    const firstResult = await plugin.loadContent?.();
    const secondResult = await plugin.loadContent?.();

    expect(firstResult).toEqual(generationResult);
    expect(secondResult).toEqual(generationResult);
    expect(runPluginGenerationMock).toHaveBeenCalledTimes(1);
    expect(runPluginGenerationMock).toHaveBeenCalledWith({
      siteDir: '/repo',
      options: expect.objectContaining({
        schema: './schema.graphql',
        llmDocs: true,
        llmExamples: true,
      }),
    });
  });

  it('passes markdown redirect config to configureWebpack', () => {
    const webpackConfig = { devServer: { setupMiddlewares: vi.fn() } };
    createMarkdownRedirectWebpackConfigMock.mockReturnValue(webpackConfig);

    const plugin = graphqlDocDocusaurusPlugin(
      { siteDir: '/repo' },
      {
        markdownRedirect: {
          docsBasePath: '/docs/custom-api',
          llmDocsPath: '/llm-markdown',
          staticDir: './public-static',
        },
      }
    );

    const configured = plugin.configureWebpack?.();

    expect(configured).toEqual(webpackConfig);
    expect(createMarkdownRedirectWebpackConfigMock).toHaveBeenCalledWith({
      siteDir: '/repo',
      options: {
        enabled: true,
        docsBasePath: '/docs/custom-api',
        llmDocsPath: '/llm-markdown',
        staticDir: './public-static',
      },
    });
  });

  it('fails fast when invalid options are provided', () => {
    expect(() =>
      graphqlDocDocusaurusPlugin(
        { siteDir: '/repo' },
        {
          verbose: true,
          quiet: true,
        }
      )
    ).toThrow('verbose and quiet cannot both be true');
  });
});
