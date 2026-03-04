import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMarkdownRedirectWebpackConfig } from './markdown-redirect.js';
import type { NormalizedMarkdownRedirectOptions } from './options.js';

type MiddlewareHandler = (req: any, res: any, next: () => void) => void;

type RedirectOptionsOverrides = Partial<NormalizedMarkdownRedirectOptions> & {
  requestDetection?: Partial<NormalizedMarkdownRedirectOptions['requestDetection']>;
  docsSourceFallback?: Partial<NormalizedMarkdownRedirectOptions['docsSourceFallback']>;
};

const DEFAULT_OPTIONS: NormalizedMarkdownRedirectOptions = {
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
};

function buildOptions(overrides?: RedirectOptionsOverrides): NormalizedMarkdownRedirectOptions {
  return {
    ...DEFAULT_OPTIONS,
    ...overrides,
    requestDetection: {
      ...DEFAULT_OPTIONS.requestDetection,
      ...overrides?.requestDetection,
    },
    docsSourceFallback: {
      ...DEFAULT_OPTIONS.docsSourceFallback,
      ...overrides?.docsSourceFallback,
    },
  };
}

function createMiddleware(context: {
  siteDir: string;
  baseUrl?: string;
  options?: RedirectOptionsOverrides;
}): MiddlewareHandler {
  const webpackConfig = createMarkdownRedirectWebpackConfig({
    siteDir: context.siteDir,
    baseUrl: context.baseUrl,
    options: buildOptions(context.options),
  });
  if (!webpackConfig) {
    throw new Error('Expected markdown redirect webpack config to be enabled.');
  }

  const setupMiddlewares = (
    webpackConfig as {
      devServer?: { setupMiddlewares?: (middlewares: unknown[], devServer: unknown) => unknown[] };
    }
  ).devServer?.setupMiddlewares;

  if (!setupMiddlewares) {
    throw new Error('Expected devServer.setupMiddlewares to be defined.');
  }

  const use = vi.fn();
  setupMiddlewares([], { app: { use } });

  return use.mock.calls[0][0] as MiddlewareHandler;
}

function buildStaticDir(siteDir: string): string {
  const staticDir = path.join(siteDir, 'static');
  fs.mkdirSync(path.join(staticDir, 'llm-docs', 'users'), { recursive: true });
  fs.writeFileSync(path.join(staticDir, 'llm-docs', 'users.md'), '# Users\n');
  fs.writeFileSync(path.join(staticDir, 'llm-docs', 'users', 'get-user.md'), '# Get User\n');
  fs.writeFileSync(path.join(staticDir, 'llm-docs', 'index.md'), '# Index\n');
  return staticDir;
}

function writeDocsMetadata(siteDir: string, payload: { permalink: string; source: string }): void {
  const metadataDir = path.join(
    siteDir,
    '.docusaurus',
    'docusaurus-plugin-content-docs',
    'default'
  );
  fs.mkdirSync(metadataDir, { recursive: true });
  fs.writeFileSync(path.join(metadataDir, 'doc.json'), JSON.stringify(payload), 'utf8');
}

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  tempDirs.length = 0;
});

describe('createMarkdownRedirectWebpackConfig', () => {
  it('redirects markdown operation requests with the default root baseUrl', () => {
    const siteDir = fs.mkdtempSync(path.join(os.tmpdir(), 'graphql-doc-markdown-redirect-'));
    tempDirs.push(siteDir);
    buildStaticDir(siteDir);

    const middleware = createMiddleware({ siteDir });
    const redirect = vi.fn();
    const next = vi.fn();

    middleware(
      { path: '/docs/api/users/get-user', headers: { accept: 'text/markdown' } },
      { redirect },
      next
    );

    expect(redirect).toHaveBeenCalledWith(302, '/llm-docs/users/get-user.md');
    expect(next).not.toHaveBeenCalled();
  });

  it('supports markdown alias request headers', () => {
    const siteDir = fs.mkdtempSync(path.join(os.tmpdir(), 'graphql-doc-markdown-redirect-'));
    tempDirs.push(siteDir);
    buildStaticDir(siteDir);

    const middleware = createMiddleware({ siteDir });
    const redirect = vi.fn();
    const next = vi.fn();

    middleware(
      { path: '/docs/api/users/get-user', headers: { accept: 'text/html', 'x-doc-format': 'md' } },
      { redirect },
      next
    );

    expect(redirect).toHaveBeenCalledWith(302, '/llm-docs/users/get-user.md');
    expect(next).not.toHaveBeenCalled();
  });

  it('redirects markdown operation requests when Docusaurus uses a custom baseUrl', () => {
    const siteDir = fs.mkdtempSync(path.join(os.tmpdir(), 'graphql-doc-markdown-redirect-'));
    tempDirs.push(siteDir);
    buildStaticDir(siteDir);

    const middleware = createMiddleware({ siteDir, baseUrl: '/my-project/' });
    const redirect = vi.fn();
    const next = vi.fn();

    middleware(
      { path: '/my-project/docs/api/users/get-user', headers: { accept: 'text/markdown' } },
      { redirect },
      next
    );

    expect(redirect).toHaveBeenCalledWith(302, '/my-project/llm-docs/users/get-user.md');
    expect(next).not.toHaveBeenCalled();
  });

  it('falls back to group summary markdown when an operation markdown file is missing', () => {
    const siteDir = fs.mkdtempSync(path.join(os.tmpdir(), 'graphql-doc-markdown-redirect-'));
    tempDirs.push(siteDir);
    buildStaticDir(siteDir);

    const middleware = createMiddleware({ siteDir });
    const redirect = vi.fn();
    const next = vi.fn();

    middleware(
      { path: '/docs/api/users/unknown-operation', headers: { accept: 'text/markdown' } },
      { redirect },
      next
    );

    expect(redirect).toHaveBeenCalledWith(302, '/llm-docs/users.md');
    expect(next).not.toHaveBeenCalled();
  });

  it('redirects docs base-path root requests to llm index markdown', () => {
    const siteDir = fs.mkdtempSync(path.join(os.tmpdir(), 'graphql-doc-markdown-redirect-'));
    tempDirs.push(siteDir);
    buildStaticDir(siteDir);

    const middleware = createMiddleware({ siteDir });
    const redirect = vi.fn();
    const next = vi.fn();

    middleware({ path: '/docs/api', headers: { accept: 'text/markdown' } }, { redirect }, next);

    expect(redirect).toHaveBeenCalledWith(302, '/llm-docs/index.md');
    expect(next).not.toHaveBeenCalled();
  });

  it('does not redirect markdown requests for paths that only share a prefix', () => {
    const siteDir = fs.mkdtempSync(path.join(os.tmpdir(), 'graphql-doc-markdown-redirect-'));
    tempDirs.push(siteDir);
    buildStaticDir(siteDir);

    const middleware = createMiddleware({ siteDir });
    const redirect = vi.fn();
    const next = vi.fn();

    middleware(
      { path: '/docs/apiary/settings', headers: { accept: 'text/markdown' } },
      { redirect },
      next
    );

    expect(redirect).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('returns source markdown for non-graphql docs routes when metadata is available', () => {
    const siteDir = fs.mkdtempSync(path.join(os.tmpdir(), 'graphql-doc-markdown-redirect-'));
    tempDirs.push(siteDir);
    buildStaticDir(siteDir);

    const sourceFilePath = path.join(siteDir, 'docs', 'guides', 'overview.mdx');
    fs.mkdirSync(path.dirname(sourceFilePath), { recursive: true });
    fs.writeFileSync(sourceFilePath, '# Overview\n');
    writeDocsMetadata(siteDir, {
      permalink: '/docs/guides/overview',
      source: '@site/docs/guides/overview.mdx',
    });

    const middleware = createMiddleware({ siteDir });
    const redirect = vi.fn();
    const setHeader = vi.fn();
    const type = vi.fn();
    const sendFile = vi.fn();
    const next = vi.fn();

    middleware(
      { path: '/docs/guides/overview', headers: { accept: 'text/markdown' } },
      { redirect, setHeader, type, sendFile },
      next
    );

    expect(redirect).not.toHaveBeenCalled();
    expect(setHeader).toHaveBeenCalledWith('Vary', 'Accept');
    expect(type).toHaveBeenCalledWith('text/markdown; charset=utf-8');
    expect(sendFile).toHaveBeenCalledWith(sourceFilePath);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns source markdown with baseUrl-scoped requests', () => {
    const siteDir = fs.mkdtempSync(path.join(os.tmpdir(), 'graphql-doc-markdown-redirect-'));
    tempDirs.push(siteDir);
    buildStaticDir(siteDir);

    const sourceFilePath = path.join(siteDir, 'docs', 'intro.mdx');
    fs.mkdirSync(path.dirname(sourceFilePath), { recursive: true });
    fs.writeFileSync(sourceFilePath, '# Intro\n');
    writeDocsMetadata(siteDir, {
      permalink: '/docs/intro',
      source: '@site/docs/intro.mdx',
    });

    const middleware = createMiddleware({ siteDir, baseUrl: '/my-project/' });
    const sendFile = vi.fn();
    const next = vi.fn();

    middleware(
      { path: '/my-project/docs/intro', headers: { accept: 'text/markdown' } },
      { redirect: vi.fn(), sendFile },
      next
    );

    expect(sendFile).toHaveBeenCalledWith(sourceFilePath);
    expect(next).not.toHaveBeenCalled();
  });

  it('respects docs source fallback base-path filters', () => {
    const siteDir = fs.mkdtempSync(path.join(os.tmpdir(), 'graphql-doc-markdown-redirect-'));
    tempDirs.push(siteDir);
    buildStaticDir(siteDir);

    const sourceFilePath = path.join(siteDir, 'docs', 'guides', 'overview.mdx');
    fs.mkdirSync(path.dirname(sourceFilePath), { recursive: true });
    fs.writeFileSync(sourceFilePath, '# Overview\n');
    writeDocsMetadata(siteDir, {
      permalink: '/docs/guides/overview',
      source: '@site/docs/guides/overview.mdx',
    });

    const middleware = createMiddleware({
      siteDir,
      options: {
        docsSourceFallback: {
          docsBasePaths: ['/guides'],
        },
      },
    });
    const next = vi.fn();

    middleware(
      { path: '/docs/guides/overview', headers: { accept: 'text/markdown' } },
      { redirect: vi.fn(), sendFile: vi.fn() },
      next
    );

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('passes through non-markdown requests', () => {
    const siteDir = fs.mkdtempSync(path.join(os.tmpdir(), 'graphql-doc-markdown-redirect-'));
    tempDirs.push(siteDir);
    buildStaticDir(siteDir);

    const middleware = createMiddleware({ siteDir });
    const redirect = vi.fn();
    const next = vi.fn();

    middleware(
      { path: '/docs/api/users/get-user', headers: { accept: 'text/html' } },
      { redirect },
      next
    );

    expect(redirect).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('passes through requests with no Accept header', () => {
    const siteDir = fs.mkdtempSync(path.join(os.tmpdir(), 'graphql-doc-markdown-redirect-'));
    tempDirs.push(siteDir);
    buildStaticDir(siteDir);

    const middleware = createMiddleware({ siteDir });
    const redirect = vi.fn();
    const next = vi.fn();

    middleware({ path: '/docs/api/users/get-user', headers: {} }, { redirect }, next);

    expect(redirect).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('passes through llms manifest requests', () => {
    const siteDir = fs.mkdtempSync(path.join(os.tmpdir(), 'graphql-doc-markdown-redirect-'));
    tempDirs.push(siteDir);
    buildStaticDir(siteDir);

    const middleware = createMiddleware({ siteDir });
    const redirect = vi.fn();
    const next = vi.fn();

    middleware({ path: '/llms.txt', headers: { accept: 'text/markdown' } }, { redirect }, next);

    expect(redirect).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('passes through requests already targeting llm docs', () => {
    const siteDir = fs.mkdtempSync(path.join(os.tmpdir(), 'graphql-doc-markdown-redirect-'));
    tempDirs.push(siteDir);
    buildStaticDir(siteDir);

    const middleware = createMiddleware({ siteDir });
    const redirect = vi.fn();
    const next = vi.fn();

    middleware(
      { path: '/llm-docs/users.md', headers: { accept: 'text/markdown' } },
      { redirect },
      next
    );

    expect(redirect).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('returns undefined when markdown redirect is disabled', () => {
    const webpackConfig = createMarkdownRedirectWebpackConfig({
      siteDir: '/repo',
      options: buildOptions({
        enabled: false,
      }),
    });

    expect(webpackConfig).toBeUndefined();
  });
});
