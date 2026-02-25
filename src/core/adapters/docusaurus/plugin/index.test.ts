import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const runPluginGenerationMock = vi.hoisted(() => vi.fn());
const buildPluginWatchTargetsMock = vi.hoisted(() => vi.fn());
const createMarkdownRedirectWebpackConfigMock = vi.hoisted(() => vi.fn());
const registerCliCommandsMock = vi.hoisted(() => vi.fn());

vi.mock('./run-generation.js', () => ({
  buildPluginWatchTargets: buildPluginWatchTargetsMock,
  runPluginGeneration: runPluginGenerationMock,
}));

vi.mock('./markdown-redirect.js', () => ({
  createMarkdownRedirectWebpackConfig: createMarkdownRedirectWebpackConfigMock,
}));

vi.mock('./extend-cli.js', () => ({
  registerCliCommands: registerCliCommandsMock,
}));

import graphqlDocDocusaurusPlugin, { getSwizzleComponentList } from './index.js';

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

  it('logs a plugin ordering reminder when verbose mode is enabled', async () => {
    const generationResult = {
      schemaPointer: '/repo/schema.graphql',
      outputDir: '/repo/docs/api',
      llmOutputDir: '/repo/static/llm-docs',
      filesWritten: 4,
      llmFilesWritten: 1,
    };
    runPluginGenerationMock.mockResolvedValue(generationResult);

    const plugin = graphqlDocDocusaurusPlugin(
      { siteDir: '/repo' },
      {
        verbose: true,
      }
    );
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await plugin.loadContent?.();

    expect(logSpy).toHaveBeenCalledWith(
      '[graphql-doc] Generation starting - ensure this plugin is listed before content-docs'
    );
    logSpy.mockRestore();
  });

  it('returns a zero-result payload when generation fails', async () => {
    runPluginGenerationMock.mockRejectedValue(new Error('schema endpoint is unreachable'));

    const plugin = graphqlDocDocusaurusPlugin(
      { siteDir: '/repo' },
      {
        schema: './schema.graphql',
        outputDir: './docs/api',
      }
    );
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const result = await plugin.loadContent?.();

    expect(result).toEqual({
      schemaPointer: './schema.graphql',
      outputDir: './docs/api',
      filesWritten: 0,
      llmFilesWritten: 0,
    });
    expect(errorSpy).toHaveBeenCalledWith(
      '[graphql-doc] Generation failed: schema endpoint is unreachable'
    );
    errorSpy.mockRestore();
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

  it('registers graphql-doc CLI commands through extendCli', () => {
    const plugin = graphqlDocDocusaurusPlugin(
      { siteDir: '/repo' },
      {
        schema: './schema.graphql',
        configPath: './graphql-doc.config.json',
      }
    );
    const cli = {
      command: vi.fn(),
    };

    plugin.extendCli?.(cli as any);

    expect(registerCliCommandsMock).toHaveBeenCalledWith(
      cli,
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
    const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'graphql-doc-content-loaded-'));

    try {
      await plugin.contentLoaded?.({
        content: {
          schemaPointer: './schema.graphql',
          outputDir,
          llmOutputDir: '/repo/static/llm-docs',
          filesWritten: 14,
          llmFilesWritten: 3,
        },
        actions: {
          setGlobalData,
        },
      } as any);
    } finally {
      fs.rmSync(outputDir, { recursive: true, force: true });
    }

    expect(setGlobalData).toHaveBeenCalledWith({
      filesWritten: 14,
      llmFilesWritten: 3,
      outputDir,
      schemaPointer: './schema.graphql',
    });
  });

  it('warns when generation reports files written but output directory is missing', async () => {
    const plugin = graphqlDocDocusaurusPlugin({ siteDir: '/repo' });
    const setGlobalData = vi.fn();
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await plugin.contentLoaded?.({
      content: {
        schemaPointer: './schema.graphql',
        outputDir: '/repo/missing-output',
        llmOutputDir: '/repo/static/llm-docs',
        filesWritten: 1,
        llmFilesWritten: 0,
      },
      actions: {
        setGlobalData,
      },
    } as any);

    expect(warnSpy).toHaveBeenCalledWith(
      '[graphql-doc] Warning: Generation reported files written but output directory is missing. Ensure this plugin is listed before @docusaurus/preset-classic in docusaurus.config.ts.'
    );
    expect(setGlobalData).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('suppresses missing output directory warnings in quiet mode', async () => {
    const plugin = graphqlDocDocusaurusPlugin(
      { siteDir: '/repo' },
      {
        quiet: true,
      }
    );
    const setGlobalData = vi.fn();
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await plugin.contentLoaded?.({
      content: {
        schemaPointer: './schema.graphql',
        outputDir: '/repo/missing-output',
        llmOutputDir: '/repo/static/llm-docs',
        filesWritten: 1,
        llmFilesWritten: 0,
      },
      actions: {
        setGlobalData,
      },
    } as any);

    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('skips global data publication when generation returned an empty fallback result', async () => {
    const plugin = graphqlDocDocusaurusPlugin({ siteDir: '/repo' });
    const setGlobalData = vi.fn();

    await plugin.contentLoaded?.({
      content: {
        schemaPointer: '',
        outputDir: '',
        filesWritten: 0,
        llmFilesWritten: 0,
      },
      actions: {
        setGlobalData,
      },
    } as any);

    expect(setGlobalData).not.toHaveBeenCalled();
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

  it('does not log a postBuild success summary for a zero-result generation', async () => {
    const plugin = graphqlDocDocusaurusPlugin({ siteDir: '/repo' });
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await plugin.postBuild?.({
      content: {
        schemaPointer: './schema.graphql',
        outputDir: '/repo/docs/api',
        llmOutputDir: '/repo/static/llm-docs',
        filesWritten: 0,
        llmFilesWritten: 0,
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

    const configured = plugin.configureWebpack?.({}, false);

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

  it('returns an empty webpack config object for server builds', () => {
    const plugin = graphqlDocDocusaurusPlugin({ siteDir: '/repo', baseUrl: '/' });

    const configured = plugin.configureWebpack?.({}, true);

    expect(configured).toEqual({});
    expect(createMarkdownRedirectWebpackConfigMock).not.toHaveBeenCalled();
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

  it('exposes the TypeScript theme path for swizzle --typescript', () => {
    const plugin = graphqlDocDocusaurusPlugin({ siteDir: '/repo' });
    const resolvedTypeScriptThemePath = plugin.getTypeScriptThemePath?.();

    expect(resolvedTypeScriptThemePath).toBeDefined();
    expect(resolvedTypeScriptThemePath).toContain(
      path.join('src', 'core', 'adapters', 'docusaurus', 'theme')
    );
    expect(fs.existsSync(resolvedTypeScriptThemePath ?? '')).toBe(true);
  });

  it('exports a stable swizzle component allowlist', () => {
    expect(getSwizzleComponentList()).toEqual(['DocItem/Layout', 'MDXComponents']);
  });

  it('injects an LLM discovery link tag when markdown artifacts are generated', () => {
    const plugin = graphqlDocDocusaurusPlugin({ siteDir: '/repo', baseUrl: '/docs-root/' });

    const tags = plugin.injectHtmlTags?.({
      content: {
        schemaPointer: './schema.graphql',
        outputDir: '/repo/docs/api',
        llmOutputDir: '/repo/static/llm-docs',
        filesWritten: 9,
        llmFilesWritten: 2,
      },
    } as any);

    expect(tags).toEqual({
      headTags: [
        {
          tagName: 'link',
          attributes: {
            rel: 'alternate',
            type: 'text/markdown',
            href: '/docs-root/llms.txt',
            title: 'LLM-friendly documentation',
          },
        },
      ],
    });
  });

  it('does not inject LLM discovery tags when no markdown artifacts were generated', () => {
    const plugin = graphqlDocDocusaurusPlugin({ siteDir: '/repo' });

    const tags = plugin.injectHtmlTags?.({
      content: {
        schemaPointer: './schema.graphql',
        outputDir: '/repo/docs/api',
        llmOutputDir: '/repo/static/llm-docs',
        filesWritten: 9,
        llmFilesWritten: 0,
      },
    } as any);

    expect(tags).toEqual({});
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
