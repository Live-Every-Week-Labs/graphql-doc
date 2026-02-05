const path = require('path');
const fs = require('fs');

const withLeadingSlash = (value) => (value.startsWith('/') ? value : `/${value}`);
const withoutTrailingSlash = (value) => value.replace(/\/+$/, '');
const stripLeadingSlash = (value) => value.replace(/^\/+/, '');

const acceptsMarkdown = (acceptHeader) =>
  typeof acceptHeader === 'string' && acceptHeader.toLowerCase().includes('text/markdown');

const resolveTarget = (requestPath, docsBasePath, llmDocsPath, staticDir) => {
  if (!requestPath.startsWith(docsBasePath)) {
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
};

module.exports = function llmMarkdownRedirectPlugin(context, options = {}) {
  const docsBasePath = withoutTrailingSlash(withLeadingSlash(options.docsBasePath || '/docs/api'));
  const llmDocsPath = withoutTrailingSlash(withLeadingSlash(options.llmDocsPath || '/llm-docs'));
  const staticDir = options.staticDir || path.join(context.siteDir, 'static');

  return {
    name: 'llm-markdown-redirect',
    configureWebpack() {
      return {
        devServer: {
          setupMiddlewares(middlewares, devServer) {
            if (!devServer || !devServer.app) {
              return middlewares;
            }

            devServer.app.use((req, res, next) => {
              const pathName = req.path || req.url || '';
              if (!acceptsMarkdown(req.headers && req.headers.accept)) {
                return next();
              }

              if (
                pathName.startsWith(llmDocsPath) ||
                pathName === '/llms.txt' ||
                pathName === `${llmDocsPath}/index.md`
              ) {
                return next();
              }

              const target = resolveTarget(pathName, docsBasePath, llmDocsPath, staticDir);
              if (!target) {
                return next();
              }

              res.redirect(302, target);
            });

            return middlewares;
          },
        },
      };
    },
  };
};
