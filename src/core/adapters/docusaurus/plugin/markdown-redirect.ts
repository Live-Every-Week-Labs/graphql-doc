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
  method?: string;
  path?: string;
  url?: string;
  headers?: Record<string, string | string[] | undefined>;
}

interface ResponseLike {
  redirect: (status: number, target: string) => void;
  setHeader?: (name: string, value: string) => void;
  type?: (value: string) => void;
  sendFile?: (filePath: string) => void;
  send?: (body: string) => void;
  end?: (body: string) => void;
}

const withLeadingSlash = (value: string): string => (value.startsWith('/') ? value : `/${value}`);
const withoutTrailingSlash = (value: string): string => value.replace(/\/+$/, '');
const stripLeadingSlash = (value: string): string => value.replace(/^\/+/, '');
const stripTrailingSlash = (value: string): string => value.replace(/\/+$/, '');
const MARKDOWN_SOURCE_EXTENSIONS = new Set(['.md', '.mdx']);

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

function toHeaderValueString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value.join(',').toLowerCase().trim();
  }

  return `${value ?? ''}`.toLowerCase().trim();
}

function requestWantsMarkdown(
  headers: RequestLike['headers'],
  options: NormalizedMarkdownRedirectOptions['requestDetection']
): boolean {
  const acceptHeader = toHeaderValueString(headers?.accept);
  if (options.acceptTypes.some((acceptType) => acceptHeader.includes(acceptType.toLowerCase()))) {
    return true;
  }

  const markdownHeaderValues = new Set(options.headerValues.map((value) => value.toLowerCase()));
  return options.headerNames.some((headerName) =>
    markdownHeaderValues.has(toHeaderValueString(headers?.[headerName.toLowerCase()]))
  );
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

  const segments = relative.split('/').filter(Boolean);
  const groupSlug = segments[0];
  if (!groupSlug) {
    return `${llmDocsPath}/index.md`;
  }

  if (segments.length > 1) {
    const operationSlug = segments[segments.length - 1];
    const operationCandidate = path.join(
      staticDir,
      stripLeadingSlash(llmDocsPath),
      groupSlug,
      `${operationSlug}.md`
    );
    if (fs.existsSync(operationCandidate)) {
      return `${llmDocsPath}/${groupSlug}/${operationSlug}.md`;
    }
  }

  const groupCandidate = path.join(staticDir, stripLeadingSlash(llmDocsPath), `${groupSlug}.md`);
  if (fs.existsSync(groupCandidate)) {
    return `${llmDocsPath}/${groupSlug}.md`;
  }

  return `${llmDocsPath}/index.md`;
}

function normalizeRouteKey(pathname: string): string {
  return stripTrailingSlash(pathname) || '/';
}

function matchesAnyDocsBasePath(requestPath: string, docsBasePaths: string[]): boolean {
  return docsBasePaths.some((docsBasePath) => {
    const normalizedDocsBasePath = withoutTrailingSlash(withLeadingSlash(docsBasePath));
    return (
      requestPath === normalizedDocsBasePath || requestPath.startsWith(`${normalizedDocsBasePath}/`)
    );
  });
}

function resolveSourcePath(siteDir: string, sourceValue: string): string {
  if (sourceValue.startsWith('@site/')) {
    return path.join(siteDir, sourceValue.slice('@site/'.length));
  }

  if (path.isAbsolute(sourceValue)) {
    return sourceValue;
  }

  return path.resolve(siteDir, sourceValue);
}

function resolveDocsSourceMarkdownPath(
  siteDir: string,
  requestPath: string,
  fallbackOptions: NormalizedMarkdownRedirectOptions['docsSourceFallback']
): string | undefined {
  if (
    !fallbackOptions.enabled ||
    !matchesAnyDocsBasePath(requestPath, fallbackOptions.docsBasePaths)
  ) {
    return undefined;
  }

  const requestRouteKey = normalizeRouteKey(requestPath);
  for (const pluginId of fallbackOptions.docsPluginIds) {
    const docsMetadataDir = path.resolve(siteDir, fallbackOptions.metadataBaseDir, pluginId);
    if (!fs.existsSync(docsMetadataDir)) {
      continue;
    }

    const metadataEntries = fs.readdirSync(docsMetadataDir, { withFileTypes: true });
    for (const entry of metadataEntries) {
      if (!entry.isFile() || !entry.name.endsWith('.json')) {
        continue;
      }

      const metadataPath = path.join(docsMetadataDir, entry.name);
      try {
        const payload = JSON.parse(fs.readFileSync(metadataPath, 'utf8')) as {
          permalink?: unknown;
          source?: unknown;
        };
        if (typeof payload.permalink !== 'string' || typeof payload.source !== 'string') {
          continue;
        }

        if (normalizeRouteKey(payload.permalink) !== requestRouteKey) {
          continue;
        }

        const sourcePath = resolveSourcePath(siteDir, payload.source);
        if (
          fs.existsSync(sourcePath) &&
          MARKDOWN_SOURCE_EXTENSIONS.has(path.extname(sourcePath).toLowerCase())
        ) {
          return sourcePath;
        }
      } catch {
        // Invalid metadata JSON should not break docs serving.
        continue;
      }
    }
  }

  return undefined;
}

function sendMarkdownSource(res: ResponseLike, markdownPath: string): boolean {
  if (!fs.existsSync(markdownPath)) {
    return false;
  }

  res.setHeader?.('Vary', 'Accept');
  res.type?.('text/markdown; charset=utf-8');

  if (typeof res.sendFile === 'function') {
    res.sendFile(markdownPath);
    return true;
  }

  const content = fs.readFileSync(markdownPath, 'utf8');
  if (typeof res.send === 'function') {
    res.send(content);
    return true;
  }

  if (typeof res.end === 'function') {
    res.end(content);
    return true;
  }

  return false;
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
          if (req.method && req.method !== 'GET' && req.method !== 'HEAD') {
            return next();
          }

          const requestPath =
            stripTrailingSlash((req.path || req.url || '').split('?')[0] || '/') || '/';
          if (!requestWantsMarkdown(req.headers, context.options.requestDetection)) {
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
            const docsSourcePath = resolveDocsSourceMarkdownPath(
              context.siteDir,
              scopedRequestPath,
              context.options.docsSourceFallback
            );

            if (docsSourcePath && sendMarkdownSource(res, docsSourcePath)) {
              return;
            }

            return next();
          }

          res.redirect(302, prefixWithBaseUrl(target, baseUrlPrefix));
        });

        return middlewares;
      },
    },
  };
}
