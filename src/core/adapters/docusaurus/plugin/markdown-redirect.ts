import fs from 'fs';
import path from 'path';
import type { NormalizedMarkdownRedirectOptions } from './options.js';

interface MarkdownRedirectRuntimeContext {
  siteDir: string;
  baseUrl?: string;
  options: NormalizedMarkdownRedirectOptions;
}

interface DevServerLike {
  app?: {
    use: (handler: (req: RequestLike, res: ResponseLike, next: () => void) => void) => void;
  };
}

interface RequestLike {
  path?: string;
  url?: string;
  headers?: {
    accept?: string;
  };
}

interface ResponseLike {
  redirect: (status: number, target: string) => void;
}

const withLeadingSlash = (value: string): string => (value.startsWith('/') ? value : `/${value}`);
const withoutTrailingSlash = (value: string): string => value.replace(/\/+$/, '');
const stripLeadingSlash = (value: string): string => value.replace(/^\/+/, '');
const stripTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

function normalizeBaseUrlPrefix(baseUrl: string | undefined): string {
  if (!baseUrl || baseUrl === '/') {
    return '';
  }

  return withoutTrailingSlash(withLeadingSlash(baseUrl));
}

function prefixWithBaseUrl(pathname: string, baseUrlPrefix: string): string {
  return baseUrlPrefix ? `${baseUrlPrefix}${pathname}` : pathname;
}

function stripBaseUrlPrefix(requestPath: string, baseUrlPrefix: string): string | undefined {
  if (!baseUrlPrefix) {
    return requestPath;
  }

  if (requestPath === baseUrlPrefix) {
    return '/';
  }

  if (requestPath.startsWith(`${baseUrlPrefix}/`)) {
    return requestPath.slice(baseUrlPrefix.length);
  }

  return undefined;
}

function acceptsMarkdown(acceptHeader: string | undefined): boolean {
  return typeof acceptHeader === 'string' && acceptHeader.toLowerCase().includes('text/markdown');
}

function matchesDocsBasePath(requestPath: string, docsBasePath: string): boolean {
  return requestPath === docsBasePath || requestPath.startsWith(`${docsBasePath}/`);
}

function resolveTarget(
  requestPath: string,
  docsBasePath: string,
  llmDocsPath: string,
  staticDir: string
): string | undefined {
  if (!matchesDocsBasePath(requestPath, docsBasePath)) {
    return undefined;
  }

  const relative = requestPath.slice(docsBasePath.length).replace(/^\/+/, '');
  if (!relative) {
    return `${llmDocsPath}/index.md`;
  }

  const groupSlug = relative.split('/')[0];
  if (!groupSlug) {
    return `${llmDocsPath}/index.md`;
  }

  const candidate = path.join(staticDir, stripLeadingSlash(llmDocsPath), `${groupSlug}.md`);
  if (fs.existsSync(candidate)) {
    return `${llmDocsPath}/${groupSlug}.md`;
  }

  return `${llmDocsPath}/index.md`;
}

/**
 * Create Docusaurus webpack dev-server middleware config that redirects
 * markdown-aware requests for API docs pages to raw LLM markdown artifacts.
 */
export function createMarkdownRedirectWebpackConfig(
  context: MarkdownRedirectRuntimeContext
): Record<string, unknown> | undefined {
  if (!context.options.enabled) {
    return undefined;
  }

  const docsBasePath = withoutTrailingSlash(withLeadingSlash(context.options.docsBasePath));
  const llmDocsPath = withoutTrailingSlash(withLeadingSlash(context.options.llmDocsPath));
  const baseUrlPrefix = normalizeBaseUrlPrefix(context.baseUrl);
  const staticDir = context.options.staticDir
    ? path.isAbsolute(context.options.staticDir)
      ? context.options.staticDir
      : path.resolve(context.siteDir, context.options.staticDir)
    : path.join(context.siteDir, 'static');

  return {
    devServer: {
      setupMiddlewares: (middlewares: unknown[], devServer: DevServerLike) => {
        if (!devServer || !devServer.app) {
          return middlewares;
        }

        devServer.app.use((req: RequestLike, res: ResponseLike, next: () => void) => {
          const requestPath =
            stripTrailingSlash((req.path || req.url || '').split('?')[0] || '/') || '/';
          if (!acceptsMarkdown(req.headers?.accept)) {
            return next();
          }

          const scopedRequestPath = stripBaseUrlPrefix(requestPath, baseUrlPrefix);
          if (!scopedRequestPath) {
            return next();
          }

          if (
            scopedRequestPath.startsWith(llmDocsPath) ||
            scopedRequestPath === '/llms.txt' ||
            scopedRequestPath === `${llmDocsPath}/index.md`
          ) {
            return next();
          }

          const target = resolveTarget(scopedRequestPath, docsBasePath, llmDocsPath, staticDir);
          if (!target) {
            return next();
          }

          res.redirect(302, prefixWithBaseUrl(target, baseUrlPrefix));
        });

        return middlewares;
      },
    },
  };
}
