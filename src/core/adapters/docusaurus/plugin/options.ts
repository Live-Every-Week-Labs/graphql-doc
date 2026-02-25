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
  markdownRedirect?: MarkdownRedirectOptions;
  watch?: boolean;
  verbose?: boolean;
  quiet?: boolean;
}

export interface MarkdownRedirectOptions {
  enabled?: boolean;
  docsBasePath?: string;
  llmDocsPath?: string;
  staticDir?: string;
}

export interface NormalizedMarkdownRedirectOptions {
  enabled: boolean;
  docsBasePath: string;
  llmDocsPath: string;
  staticDir?: string;
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
  markdownRedirect: NormalizedMarkdownRedirectOptions;
  watch: boolean;
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
    markdownRedirect: {
      enabled: options.markdownRedirect?.enabled ?? true,
      docsBasePath: options.markdownRedirect?.docsBasePath ?? '/docs/api',
      llmDocsPath: options.markdownRedirect?.llmDocsPath ?? '/llm-docs',
      staticDir: options.markdownRedirect?.staticDir,
    },
    watch: options.watch ?? false,
    verbose: options.verbose ?? false,
    quiet: options.quiet ?? false,
  };
}

/**
 * Validate normalized plugin options and fail fast on unsupported combinations.
 */
export function validatePluginOptions(options: NormalizedGraphqlDocDocusaurusPluginOptions): void {
  if (options.verbose && options.quiet) {
    throw new Error('Invalid graphql-doc plugin options: verbose and quiet cannot both be true.');
  }

  if (options.watch) {
    throw new Error(
      'The graphql-doc Docusaurus plugin does not support watch mode yet. ' +
        'Generation currently runs once per startup/build.'
    );
  }

  if (!options.markdownRedirect.docsBasePath.trim()) {
    throw new Error('Invalid graphql-doc plugin options: markdownRedirect.docsBasePath is empty.');
  }

  if (!options.markdownRedirect.llmDocsPath.trim()) {
    throw new Error('Invalid graphql-doc plugin options: markdownRedirect.llmDocsPath is empty.');
  }
}
