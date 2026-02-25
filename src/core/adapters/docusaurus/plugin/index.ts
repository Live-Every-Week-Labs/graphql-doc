import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
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

const runtimeDir = typeof __dirname === 'string' ? __dirname : process.cwd();
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
      return runPluginGeneration({
        siteDir: context.siteDir,
        options,
      });
    },
    contentLoaded({ content, actions }) {
      actions.setGlobalData({
        filesWritten: content.filesWritten,
        llmFilesWritten: content.llmFilesWritten,
        outputDir: content.outputDir,
        schemaPointer: content.schemaPointer,
      });
    },
    postBuild({ content }) {
      if (options.quiet) {
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
    getClientModules() {
      return [
        runtimeRequire.resolve('@lewl/graphql-doc/components/styles.css'),
        runtimeRequire.resolve('@lewl/graphql-doc/components/docusaurus.css'),
      ];
    },
    getThemePath() {
      return themePath;
    },
  };
}

export { validateOptions, type GraphqlDocDocusaurusPluginOptions } from './options.js';
