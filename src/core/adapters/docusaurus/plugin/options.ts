import type { OptionValidationContext } from '@docusaurus/types';

/**
 * User-facing options accepted by the Docusaurus plugin entrypoint.
 *
 * These options are intentionally close to CLI flags so existing users can
 * migrate to plugin usage with minimal cognitive overhead.
 */
export interface GraphqlDocDocusaurusPluginOptions {
  id?: string;
  configPath?: string;
  schema?: string | string[];
  outputDir?: string;
  cleanOutput?: boolean;
  llmDocs?: boolean;
  llmDocsStrategy?: 'single' | 'chunked';
  llmDocsDepth?: 1 | 2 | 3 | 4 | 5;
  llmExamples?: boolean;
  markdownRedirect?: MarkdownRedirectOptions;
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
  id?: string;
  configPath?: string;
  schema?: string | string[];
  outputDir?: string;
  cleanOutput?: boolean;
  llmDocs: boolean;
  llmDocsStrategy?: 'single' | 'chunked';
  llmDocsDepth?: 1 | 2 | 3 | 4 | 5;
  llmExamples: boolean;
  markdownRedirect: NormalizedMarkdownRedirectOptions;
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
    id: options.id,
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

  if (!options.markdownRedirect.docsBasePath.trim()) {
    throw new Error('Invalid graphql-doc plugin options: markdownRedirect.docsBasePath is empty.');
  }

  if (!options.markdownRedirect.llmDocsPath.trim()) {
    throw new Error('Invalid graphql-doc plugin options: markdownRedirect.llmDocsPath is empty.');
  }
}

function createDocusaurusValidationError(message: string): Error {
  const validationError = new Error(message);
  validationError.name = 'ValidationError';
  return validationError;
}

/**
 * Validate plugin options using Docusaurus's `validateOptions` module contract.
 *
 * Docusaurus invokes this before plugin initialization so startup failures are
 * surfaced during option validation rather than deep in plugin execution.
 */
export function validateOptions(
  context: OptionValidationContext<
    GraphqlDocDocusaurusPluginOptions,
    GraphqlDocDocusaurusPluginOptions
  >
): GraphqlDocDocusaurusPluginOptions {
  // Deliberately keep validation on the shared normalize+validate path instead
  // of Joi/context.validate so CLI and plugin runtimes enforce identical rules.
  const rawOptions = context.options ?? {};
  const normalizedOptions = normalizePluginOptions(rawOptions);

  try {
    validatePluginOptions(normalizedOptions);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Invalid graphql-doc plugin options supplied.';
    throw createDocusaurusValidationError(message);
  }

  return {
    id: rawOptions.id ?? 'default',
    ...rawOptions,
  };
}
