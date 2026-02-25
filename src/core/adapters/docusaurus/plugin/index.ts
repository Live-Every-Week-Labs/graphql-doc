import { createRequire } from 'node:module';
import type { LoadContext, Plugin } from '@docusaurus/types';
import {
  normalizePluginOptions,
  validateOptions,
  validatePluginOptions,
  type GraphqlDocDocusaurusPluginOptions,
} from './options.js';
import { createMarkdownRedirectWebpackConfig } from './markdown-redirect.js';
import { runPluginGeneration, type PluginGenerationResult } from './run-generation.js';

const require = createRequire(import.meta.url);

/**
 * Docusaurus plugin entrypoint for graphql-doc generation.
 *
 * The plugin performs a single generation pass during Docusaurus plugin
 * lifecycle loading so downstream docs plugins consume fresh generated files.
 */
export default function graphqlDocDocusaurusPlugin(
  context: LoadContext,
  rawOptions: GraphqlDocDocusaurusPluginOptions = {}
): Plugin<PluginGenerationResult> {
  const options = normalizePluginOptions(rawOptions);
  validatePluginOptions(options);
  let generationPromise: Promise<PluginGenerationResult> | null = null;

  return {
    name: 'graphql-doc-docusaurus-plugin',
    async loadContent() {
      // Generation is intentionally tied to loadContent so it runs during
      // startup/build and before downstream plugin content phases consume
      // generated files.
      //
      // Docusaurus can re-enter hooks in long-running sessions. Memoization
      // keeps this plugin deterministic by executing at most once per lifecycle.
      if (!generationPromise) {
        generationPromise = runPluginGeneration({
          siteDir: context.siteDir,
          options,
        });
      }
      return generationPromise;
    },
    configureWebpack() {
      return createMarkdownRedirectWebpackConfig({
        siteDir: context.siteDir,
        options: options.markdownRedirect,
      });
    },
    getClientModules() {
      return [
        require.resolve('@lewl/graphql-doc/components/styles.css'),
        require.resolve('@lewl/graphql-doc/components/docusaurus.css'),
      ];
    },
  };
}

export { validateOptions, type GraphqlDocDocusaurusPluginOptions } from './options.js';
