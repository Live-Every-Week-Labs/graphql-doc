import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const runPluginGenerationMock = vi.hoisted(() => vi.fn());
const buildPluginWatchTargetsMock = vi.hoisted(() => vi.fn());
const createMarkdownRedirectWebpackConfigMock = vi.hoisted(() => vi.fn());

vi.mock('./run-generation.js', () => ({
  buildPluginWatchTargets: buildPluginWatchTargetsMock,
  runPluginGeneration: runPluginGenerationMock,
}));

vi.mock('./markdown-redirect.js', () => ({
  createMarkdownRedirectWebpackConfig: createMarkdownRedirectWebpackConfigMock,
}));

import graphqlDocDocusaurusPlugin from './index.js';

const require = createRequire(import.meta.url);

describe('graphqlDocDocusaurusPlugin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exposes the expected plugin name', () => {
    const plugin = graphqlDocDocusaurusPlugin({ siteDir: '/repo' });
    expect(plugin.name).toBe('graphql-doc-docusaurus-plugin');
  });

  it('runs generation from loadContent on each lifecycle invocation', async () => {
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
    expect(runPluginGenerationMock).toHaveBeenCalledTimes(2);
    expect(runPluginGenerationMock).toHaveBeenCalledWith({
      siteDir: '/repo',
      options: expect.objectContaining({
        schema: './schema.graphql',
        llmDocs: true,
        llmExamples: true,
      }),
    });
  });

  it('returns watch targets for schema and config sources', () => {
    buildPluginWatchTargetsMock.mockReturnValue(['/repo/schema.graphql', '/repo/config.json']);

    const plugin = graphqlDocDocusaurusPlugin(
      { siteDir: '/repo' },
      {
        schema: './schema.graphql',
        configPath: './graphql-doc.config.json',
      }
    );

    expect(plugin.getPathsToWatch?.()).toEqual(['/repo/schema.graphql', '/repo/config.json']);
    expect(buildPluginWatchTargetsMock).toHaveBeenCalledWith(
      '/repo',
      expect.objectContaining({
        schema: './schema.graphql',
        configPath: './graphql-doc.config.json',
      })
    );
  });

  it('publishes generation metadata via contentLoaded global data', async () => {
    const plugin = graphqlDocDocusaurusPlugin({ siteDir: '/repo' });
    const setGlobalData = vi.fn();

    await plugin.contentLoaded?.({
      content: {
        schemaPointer: './schema.graphql',
        outputDir: '/repo/docs/api',
        llmOutputDir: '/repo/static/llm-docs',
        filesWritten: 14,
        llmFilesWritten: 3,
      },
      actions: {
        setGlobalData,
      },
    } as any);

    expect(setGlobalData).toHaveBeenCalledWith({
      filesWritten: 14,
      llmFilesWritten: 3,
      outputDir: '/repo/docs/api',
      schemaPointer: './schema.graphql',
    });
  });

  it('logs a postBuild summary when quiet mode is disabled', async () => {
    const plugin = graphqlDocDocusaurusPlugin({ siteDir: '/repo' });
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await plugin.postBuild?.({
      content: {
        schemaPointer: './schema.graphql',
        outputDir: '/repo/docs/api',
        llmOutputDir: '/repo/static/llm-docs',
        filesWritten: 9,
        llmFilesWritten: 2,
      },
    } as any);

    expect(logSpy).toHaveBeenCalledWith('[graphql-doc] Built 9 API docs, 2 LLM docs');
    logSpy.mockRestore();
  });

  it('suppresses postBuild summary logs in quiet mode', async () => {
    const plugin = graphqlDocDocusaurusPlugin(
      { siteDir: '/repo' },
      {
        quiet: true,
      }
    );
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await plugin.postBuild?.({
      content: {
        schemaPointer: './schema.graphql',
        outputDir: '/repo/docs/api',
        llmOutputDir: '/repo/static/llm-docs',
        filesWritten: 9,
        llmFilesWritten: 2,
      },
    } as any);

    expect(logSpy).not.toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('passes markdown redirect config to configureWebpack', () => {
    const webpackConfig = { devServer: { setupMiddlewares: vi.fn() } };
    createMarkdownRedirectWebpackConfigMock.mockReturnValue(webpackConfig);

    const plugin = graphqlDocDocusaurusPlugin(
      { siteDir: '/repo', baseUrl: '/' },
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
      baseUrl: '/',
      options: {
        enabled: true,
        docsBasePath: '/docs/custom-api',
        llmDocsPath: '/llm-markdown',
        staticDir: './public-static',
      },
    });
  });

  it('injects graphql-doc CSS modules into the client bundle', () => {
    const plugin = graphqlDocDocusaurusPlugin({ siteDir: '/repo' });

    expect(plugin.getClientModules?.()).toEqual([
      require.resolve('@lewl/graphql-doc/components/styles.css'),
      require.resolve('@lewl/graphql-doc/components/docusaurus.css'),
    ]);
  });

  it('exposes the bundled graphql-doc Docusaurus theme path', () => {
    const plugin = graphqlDocDocusaurusPlugin({ siteDir: '/repo' });
    const resolvedThemePath = plugin.getThemePath?.();

    expect(resolvedThemePath).toBeDefined();
    expect(resolvedThemePath).toContain(
      path.join('src', 'core', 'adapters', 'docusaurus', 'theme')
    );
    expect(fs.existsSync(resolvedThemePath ?? '')).toBe(true);
  });

  it('resolves theme path from the plugin module location when cwd changes', async () => {
    const originalCwd = process.cwd();
    const tempSiteDir = fs.mkdtempSync(path.join(os.tmpdir(), 'graphql-doc-plugin-site-'));
    fs.writeFileSync(path.join(tempSiteDir, 'package.json'), '{"name":"site"}\n');

    try {
      process.chdir(tempSiteDir);
      vi.resetModules();

      const { default: pluginFactory } = await import('./index.js');
      const plugin = pluginFactory({ siteDir: tempSiteDir });
      const resolvedThemePath = plugin.getThemePath?.() ?? '';

      expect(resolvedThemePath).toContain(
        path.join('src', 'core', 'adapters', 'docusaurus', 'theme')
      );
      expect(resolvedThemePath.startsWith(tempSiteDir)).toBe(false);
      expect(fs.existsSync(resolvedThemePath)).toBe(true);
    } finally {
      process.chdir(originalCwd);
      fs.rmSync(tempSiteDir, { recursive: true, force: true });
    }
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
