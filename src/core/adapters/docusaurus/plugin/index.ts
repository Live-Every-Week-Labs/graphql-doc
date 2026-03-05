import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { LoadContext, Plugin } from '@docusaurus/types';
import {
  normalizePluginOptions,
  validateOptions,
  validatePluginOptions,
  type GraphqlDocDocusaurusPluginOptions,
} from './options.js';
import { createMarkdownRedirectWebpackConfig } from './markdown-redirect.js';
import {
  buildPluginWatchTargets,
  runPluginGeneration,
  type PluginGenerationResult,
} from './run-generation.js';
import { registerCliCommands } from './extend-cli.js';

function getRuntimeDir(): string {
  if (typeof __dirname === 'string') {
    return __dirname;
  }

  try {
    return path.dirname(fileURLToPath(import.meta.url));
  } catch {
    return process.cwd();
  }
}

const runtimeDir = getRuntimeDir();
const runtimeRequire = createRequire(path.join(runtimeDir, '__graphql-doc-plugin-runtime__.cjs'));

function resolvePackageRoot(startDir: string): string {
  let currentDir = startDir;
  while (true) {
    if (fs.existsSync(path.join(currentDir, 'package.json'))) {
      return currentDir;
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      return startDir;
    }

    currentDir = parentDir;
  }
}

const themePath = path.join(resolvePackageRoot(runtimeDir), 'dist/theme');
const DATA_TYPES_CHUNK_NAME = 'graphql-doc-types-data';
const DATA_OPERATIONS_CHUNK_NAME = 'graphql-doc-operations-data';
const DATA_TYPES_PATH_PATTERN = /[\\/]_data[\\/]types\.json$/;
const DATA_OPERATIONS_PATH_PATTERN = /[\\/]_data[\\/]operations\.json$/;

function resolveLlmsHref(baseUrl: string | undefined): string {
  if (!baseUrl) {
    return '/llms.txt';
  }

  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return `${normalizedBaseUrl}llms.txt`;
}

interface WebpackModuleLike {
  resource?: unknown;
}

function matchesDataPath(module: WebpackModuleLike, pattern: RegExp): boolean {
  return typeof module.resource === 'string' && pattern.test(module.resource);
}

/**
 * Force shared chunks for generated GraphQL data files.
 *
 * Docusaurus emits one async chunk per docs page; without explicit cache groups,
 * large `_data/*.json` modules can be duplicated across many route chunks and
 * inflate both build memory and final asset size.
 */
function createGraphqlDocDataChunkConfig(): Record<string, unknown> {
  return {
    optimization: {
      splitChunks: {
        cacheGroups: {
          graphqlDocTypesData: {
            name: DATA_TYPES_CHUNK_NAME,
            test: (module: WebpackModuleLike) => matchesDataPath(module, DATA_TYPES_PATH_PATTERN),
            chunks: 'all',
            enforce: true,
            priority: 50,
            reuseExistingChunk: true,
          },
          graphqlDocOperationsData: {
            name: DATA_OPERATIONS_CHUNK_NAME,
            test: (module: WebpackModuleLike) =>
              matchesDataPath(module, DATA_OPERATIONS_PATH_PATTERN),
            chunks: 'all',
            enforce: true,
            priority: 40,
            reuseExistingChunk: true,
          },
        },
      },
    },
  };
}

/**
 * Docusaurus plugin entrypoint for graphql-doc generation.
 *
 * Generation is tied to plugin lifecycle hooks so downstream docs plugins
 * consume fresh files both on startup and on watched-file re-invocations.
 */
export default function graphqlDocDocusaurusPlugin(
  context: LoadContext,
  rawOptions: GraphqlDocDocusaurusPluginOptions = {}
): Plugin<PluginGenerationResult> {
  const options = normalizePluginOptions(rawOptions);
  validatePluginOptions(options);

  return {
    name: 'graphql-doc-docusaurus-plugin',
    async loadContent() {
      // Generation is intentionally tied to loadContent so it runs during
      // startup/build and before downstream plugin content phases consume
      // generated files.
      if (options.verbose && !options.quiet) {
        console.log(
          '[graphql-doc] Generation starting - ensure this plugin is listed before content-docs'
        );
      }

      try {
        return await runPluginGeneration({
          siteDir: context.siteDir,
          options,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[graphql-doc] Generation failed: ${message}`);

        if (options.verbose) {
          console.error(error);
        }

        const fallbackSchemaPointer =
          options.schema && typeof options.schema === 'object' && !Array.isArray(options.schema)
            ? options.schema.primary
            : (options.schema ?? '');

        return {
          schemaPointer: fallbackSchemaPointer,
          outputDir: options.outputDir ?? '',
          filesWritten: 0,
          llmFilesWritten: 0,
          targetResults: [],
        };
      }
    },
    contentLoaded({ content, actions }) {
      if (content.filesWritten <= 0 && content.llmFilesWritten <= 0 && !content.outputDir) {
        return;
      }

      if (content.filesWritten > 0 && content.outputDir && !fs.existsSync(content.outputDir)) {
        if (!options.quiet) {
          console.warn(
            '[graphql-doc] Warning: Generation reported files written but output directory is missing. Ensure this plugin is listed before @docusaurus/preset-classic in docusaurus.config.ts.'
          );
        }
      }

      actions.setGlobalData({
        filesWritten: content.filesWritten,
        llmFilesWritten: content.llmFilesWritten,
        outputDir: content.outputDir,
        schemaPointer: content.schemaPointer,
        targetResults: content.targetResults,
      });
    },
    postBuild({ content }) {
      if (options.quiet || (content.filesWritten <= 0 && content.llmFilesWritten <= 0)) {
        return;
      }

      console.log(
        `[graphql-doc] Built ${content.filesWritten} API docs, ${content.llmFilesWritten} LLM docs`
      );
    },
    configureWebpack(_config, isServer) {
      if (isServer) {
        return {};
      }

      const markdownRedirectConfig = createMarkdownRedirectWebpackConfig({
        siteDir: context.siteDir,
        baseUrl: context.baseUrl ?? '/',
        options: options.markdownRedirect,
      });

      return {
        ...createGraphqlDocDataChunkConfig(),
        ...(markdownRedirectConfig ?? {}),
      };
    },
    getPathsToWatch() {
      if (!options.watch) {
        return [];
      }

      return buildPluginWatchTargets(context.siteDir, options);
    },
    extendCli(cli) {
      registerCliCommands(cli, context.siteDir, options);
    },
    getClientModules() {
      return [
        runtimeRequire.resolve('@lewl/graphql-doc/components/styles.css'),
        runtimeRequire.resolve('@lewl/graphql-doc/components/docusaurus.css'),
      ];
    },
    getThemePath() {
      // Consumer projects load plugin themes from node_modules; return compiled
      // JS so hosts do not need to transpile plugin TS/TSX sources.
      return themePath;
    },
    getTypeScriptThemePath() {
      // Keep runtime resolution aligned with getThemePath() to avoid parser
      // mismatches in projects that do not transpile plugin TypeScript.
      return themePath;
    },
    injectHtmlTags({ content }) {
      if (!content.llmFilesWritten || !options.markdownRedirect.enabled) {
        return {};
      }

      return {
        headTags: [
          {
            tagName: 'link',
            attributes: {
              rel: 'alternate',
              type: 'text/markdown',
              href: resolveLlmsHref(context.baseUrl),
              title: 'LLM-friendly documentation',
            },
          },
        ],
      };
    },
  };
}

/**
 * Enumerates the stable theme component IDs that can be swizzled without --danger.
 */
export function getSwizzleComponentList(): string[] {
  return ['DocItem/Layout'];
}

export { validateOptions, type GraphqlDocDocusaurusPluginOptions } from './options.js';
