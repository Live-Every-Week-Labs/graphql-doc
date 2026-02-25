/**
 * User-facing options accepted by the Docusaurus plugin entrypoint.
 *
 * These options are intentionally close to CLI flags so existing users can
 * migrate to plugin usage with minimal cognitive overhead.
 */
export interface GraphqlDocDocusaurusPluginOptions {
  configPath?: string;
  schema?: string | string[];
  outputDir?: string;
  cleanOutput?: boolean;
  llmDocs?: boolean;
  llmDocsStrategy?: 'single' | 'chunked';
  llmDocsDepth?: 1 | 2 | 3 | 4 | 5;
  llmExamples?: boolean;
  verbose?: boolean;
  quiet?: boolean;
}

/**
 * Fully normalized plugin options used by runtime code.
 */
export interface NormalizedGraphqlDocDocusaurusPluginOptions {
  configPath?: string;
  schema?: string | string[];
  outputDir?: string;
  cleanOutput?: boolean;
  llmDocs: boolean;
  llmDocsStrategy?: 'single' | 'chunked';
  llmDocsDepth?: 1 | 2 | 3 | 4 | 5;
  llmExamples: boolean;
  verbose: boolean;
  quiet: boolean;
}

/**
 * Normalize plugin options to deterministic runtime defaults.
 */
export function normalizePluginOptions(
  options: GraphqlDocDocusaurusPluginOptions = {}
): NormalizedGraphqlDocDocusaurusPluginOptions {
  return {
    configPath: options.configPath,
    schema: options.schema,
    outputDir: options.outputDir,
    cleanOutput: options.cleanOutput,
    llmDocs: options.llmDocs ?? true,
    llmDocsStrategy: options.llmDocsStrategy,
    llmDocsDepth: options.llmDocsDepth,
    llmExamples: options.llmExamples ?? true,
    verbose: options.verbose ?? false,
    quiet: options.quiet ?? false,
  };
}
