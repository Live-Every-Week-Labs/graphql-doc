import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMarkdownRedirectWebpackConfig } from './markdown-redirect.js';

type MiddlewareHandler = (req: any, res: any, next: () => void) => void;

function createMiddleware(context: {
  siteDir: string;
  baseUrl?: string;
  options: {
    enabled: boolean;
    docsBasePath: string;
    llmDocsPath: string;
    staticDir?: string;
  };
}): MiddlewareHandler {
  const webpackConfig = createMarkdownRedirectWebpackConfig(context);
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
  fs.mkdirSync(path.join(staticDir, 'llm-docs'), { recursive: true });
  fs.writeFileSync(path.join(staticDir, 'llm-docs', 'users.md'), '# Users\n');
  fs.writeFileSync(path.join(staticDir, 'llm-docs', 'index.md'), '# Index\n');
  return staticDir;
}

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  tempDirs.length = 0;
});

describe('createMarkdownRedirectWebpackConfig', () => {
  it('redirects markdown requests with the default root baseUrl', () => {
    const siteDir = fs.mkdtempSync(path.join(os.tmpdir(), 'graphql-doc-markdown-redirect-'));
    tempDirs.push(siteDir);
    buildStaticDir(siteDir);

    const middleware = createMiddleware({
      siteDir,
      options: {
        enabled: true,
        docsBasePath: '/docs/api',
        llmDocsPath: '/llm-docs',
      },
    });

    const redirect = vi.fn();
    const next = vi.fn();

    middleware(
      { path: '/docs/api/users/get-user', headers: { accept: 'text/markdown' } },
      { redirect },
      next
    );

    expect(redirect).toHaveBeenCalledWith(302, '/llm-docs/users.md');
    expect(next).not.toHaveBeenCalled();
  });

  it('redirects markdown requests when Docusaurus uses a custom baseUrl', () => {
    const siteDir = fs.mkdtempSync(path.join(os.tmpdir(), 'graphql-doc-markdown-redirect-'));
    tempDirs.push(siteDir);
    buildStaticDir(siteDir);

    const middleware = createMiddleware({
      siteDir,
      baseUrl: '/my-project/',
      options: {
        enabled: true,
        docsBasePath: '/docs/api',
        llmDocsPath: '/llm-docs',
      },
    });

    const redirect = vi.fn();
    const next = vi.fn();

    middleware(
      { path: '/my-project/docs/api/users/get-user', headers: { accept: 'text/markdown' } },
      { redirect },
      next
    );

    expect(redirect).toHaveBeenCalledWith(302, '/my-project/llm-docs/users.md');
    expect(next).not.toHaveBeenCalled();
  });

  it('handles custom baseUrl values with and without trailing slashes', () => {
    const siteDir = fs.mkdtempSync(path.join(os.tmpdir(), 'graphql-doc-markdown-redirect-'));
    tempDirs.push(siteDir);
    buildStaticDir(siteDir);

    for (const baseUrl of ['/docs-root', '/docs-root/']) {
      const middleware = createMiddleware({
        siteDir,
        baseUrl,
        options: {
          enabled: true,
          docsBasePath: '/docs/api',
          llmDocsPath: '/llm-docs',
        },
      });

      const redirect = vi.fn();
      const next = vi.fn();
      middleware(
        { path: '/docs-root/docs/api/users/get-user', headers: { accept: 'text/markdown' } },
        { redirect },
        next
      );

      expect(redirect).toHaveBeenCalledWith(302, '/docs-root/llm-docs/users.md');
      expect(next).not.toHaveBeenCalled();
    }
  });

  it('redirects docs base-path root requests to llm index markdown', () => {
    const siteDir = fs.mkdtempSync(path.join(os.tmpdir(), 'graphql-doc-markdown-redirect-'));
    tempDirs.push(siteDir);
    buildStaticDir(siteDir);

    const middleware = createMiddleware({
      siteDir,
      options: {
        enabled: true,
        docsBasePath: '/docs/api',
        llmDocsPath: '/llm-docs',
      },
    });

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

    const middleware = createMiddleware({
      siteDir,
      options: {
        enabled: true,
        docsBasePath: '/docs/api',
        llmDocsPath: '/llm-docs',
      },
    });

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
});
