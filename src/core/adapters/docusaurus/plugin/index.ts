import { normalizePluginOptions, type GraphqlDocDocusaurusPluginOptions } from './options.js';
import { runPluginGeneration, type PluginGenerationResult } from './run-generation.js';

interface DocusaurusContextLike {
  siteDir: string;
}

interface DocusaurusPluginLike {
  name: string;
  loadContent?: () => Promise<unknown>;
}

/**
 * Docusaurus plugin entrypoint for graphql-doc generation.
 *
 * The plugin performs a single generation pass during Docusaurus plugin
 * lifecycle loading so downstream docs plugins consume fresh generated files.
 */
export default function graphqlDocDocusaurusPlugin(
  context: DocusaurusContextLike,
  rawOptions: GraphqlDocDocusaurusPluginOptions = {}
): DocusaurusPluginLike {
  const options = normalizePluginOptions(rawOptions);
  let generationPromise: Promise<PluginGenerationResult> | null = null;

  return {
    name: 'graphql-doc-docusaurus-plugin',
    async loadContent() {
      // Docusaurus may call plugin hooks multiple times in long-running dev
      // sessions; memoize generation to avoid duplicate writes in one lifecycle.
      if (!generationPromise) {
        generationPromise = runPluginGeneration({
          siteDir: context.siteDir,
          options,
        });
      }
      return generationPromise;
    },
  };
}

export type { GraphqlDocDocusaurusPluginOptions } from './options.js';
