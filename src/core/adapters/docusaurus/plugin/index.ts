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

const themePath = path.join(resolvePackageRoot(runtimeDir), 'src/core/adapters/docusaurus/theme');

function resolveLlmsHref(baseUrl: string | undefined): string {
  if (!baseUrl) {
    return '/llms.txt';
  }

  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return `${normalizedBaseUrl}llms.txt`;
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

        return {
          schemaPointer: options.schema ?? '',
          outputDir: options.outputDir ?? '',
          filesWritten: 0,
          llmFilesWritten: 0,
        };
      }
    },
    contentLoaded({ content, actions }) {
      if (content.filesWritten <= 0 && content.llmFilesWritten <= 0 && !content.outputDir) {
        return;
      }

      actions.setGlobalData({
        filesWritten: content.filesWritten,
        llmFilesWritten: content.llmFilesWritten,
        outputDir: content.outputDir,
        schemaPointer: content.schemaPointer,
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
    configureWebpack() {
      return createMarkdownRedirectWebpackConfig({
        siteDir: context.siteDir,
        baseUrl: context.baseUrl ?? '/',
        options: options.markdownRedirect,
      });
    },
    getPathsToWatch() {
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
      return themePath;
    },
    getTypeScriptThemePath() {
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
  return ['DocItem/Layout', 'MDXComponents'];
}

export { validateOptions, type GraphqlDocDocusaurusPluginOptions } from './options.js';
