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

interface DocsRouteSourceCache {
  loadedAt: number;
  signature: string;
  map: Map<string, string>;
}

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

function resolveDocsMetadataDirs(
  siteDir: string,
  fallbackOptions: NormalizedMarkdownRedirectOptions['docsSourceFallback']
): string[] {
  return fallbackOptions.docsPluginIds.map((pluginId) =>
    path.resolve(siteDir, fallbackOptions.metadataBaseDir, pluginId)
  );
}

function computeDocsMetadataSignature(metadataDirs: string[]): string {
  return metadataDirs
    .map((metadataDir) => {
      if (!fs.existsSync(metadataDir)) {
        return `${metadataDir}:missing`;
      }

      const entries = fs
        .readdirSync(metadataDir, { withFileTypes: true })
        .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
        .sort((a, b) => a.name.localeCompare(b.name));

      return entries
        .map((entry) => {
          const metadataPath = path.join(metadataDir, entry.name);
          const stats = fs.statSync(metadataPath);
          return `${metadataDir}:${entry.name}:${stats.mtimeMs}`;
        })
        .join('|');
    })
    .join('||');
}

function buildDocsRouteSourceMap(siteDir: string, metadataDirs: string[]): Map<string, string> {
  const routeSourceMap = new Map<string, string>();
  for (const metadataDir of metadataDirs) {
    if (!fs.existsSync(metadataDir)) {
      continue;
    }

    const metadataEntries = fs.readdirSync(metadataDir, { withFileTypes: true });
    for (const entry of metadataEntries) {
      if (!entry.isFile() || !entry.name.endsWith('.json')) {
        continue;
      }

      const metadataPath = path.join(metadataDir, entry.name);
      try {
        const payload = JSON.parse(fs.readFileSync(metadataPath, 'utf8')) as {
          permalink?: unknown;
          source?: unknown;
        };
        if (typeof payload.permalink !== 'string' || typeof payload.source !== 'string') {
          continue;
        }

        const sourcePath = resolveSourcePath(siteDir, payload.source);
        if (
          fs.existsSync(sourcePath) &&
          MARKDOWN_SOURCE_EXTENSIONS.has(path.extname(sourcePath).toLowerCase())
        ) {
          routeSourceMap.set(normalizeRouteKey(payload.permalink), sourcePath);
        }
      } catch {
        // Invalid metadata JSON should not break docs serving.
        continue;
      }
    }
  }

  return routeSourceMap;
}

function getDocsRouteSourceMap(
  siteDir: string,
  fallbackOptions: NormalizedMarkdownRedirectOptions['docsSourceFallback'],
  cache: DocsRouteSourceCache
): Map<string, string> {
  if (!fallbackOptions.enabled) {
    return cache.map;
  }

  const now = Date.now();
  if (now - cache.loadedAt < fallbackOptions.cacheTtlMs && cache.map.size > 0) {
    return cache.map;
  }

  const metadataDirs = resolveDocsMetadataDirs(siteDir, fallbackOptions);
  try {
    const signature = computeDocsMetadataSignature(metadataDirs);
    if (signature === cache.signature && cache.map.size > 0) {
      cache.loadedAt = now;
      return cache.map;
    }

    cache.map = buildDocsRouteSourceMap(siteDir, metadataDirs);
    cache.signature = signature;
    cache.loadedAt = now;
  } catch {
    // Metadata read failures should not break docs serving.
    cache.loadedAt = now;
  }

  return cache.map;
}

function resolveDocsSourceMarkdownPath(
  requestPath: string,
  fallbackOptions: NormalizedMarkdownRedirectOptions['docsSourceFallback'],
  routeSourceMap: Map<string, string>
): string | undefined {
  if (
    !fallbackOptions.enabled ||
    !matchesAnyDocsBasePath(requestPath, fallbackOptions.docsBasePaths)
  ) {
    return undefined;
  }

  return routeSourceMap.get(normalizeRouteKey(requestPath));
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
  const docsRouteSourceCache: DocsRouteSourceCache = {
    loadedAt: 0,
    signature: '',
    map: new Map(),
  };

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
            const routeSourceMap = getDocsRouteSourceMap(
              context.siteDir,
              context.options.docsSourceFallback,
              docsRouteSourceCache
            );
            const docsSourcePath = resolveDocsSourceMarkdownPath(
              scopedRequestPath,
              context.options.docsSourceFallback,
              routeSourceMap
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
