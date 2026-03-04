import type { OptionValidationContext } from '@docusaurus/types';
import type { SchemaSourceConfig } from '../../../config/schema.js';

/**
 * User-facing options accepted by the Docusaurus plugin entrypoint.
 *
 * These options are intentionally close to CLI flags so existing users can
 * migrate to plugin usage with minimal cognitive overhead.
 */
export interface GraphqlDocDocusaurusPluginOptions {
  id?: string;
  configPath?: string;
  schema?: SchemaSourceConfig;
  outputDir?: string;
  target?: string;
  allTargets?: boolean;
  /**
   * Enable Docusaurus watch-target registration for graphql-doc inputs.
   *
   * Disabled by default because aggressive watch graphs can destabilize large
   * host sites; users can opt in when they explicitly need live regeneration.
   */
  watch?: boolean;
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
  requestDetection?: MarkdownRequestDetectionOptions;
  docsSourceFallback?: DocsSourceFallbackOptions;
}

export interface MarkdownRequestDetectionOptions {
  acceptTypes?: string[];
  headerNames?: string[];
  headerValues?: string[];
}

export interface DocsSourceFallbackOptions {
  enabled?: boolean;
  docsBasePaths?: string[];
  metadataBaseDir?: string;
  docsPluginIds?: string[];
  cacheTtlMs?: number;
}

export interface NormalizedMarkdownRedirectOptions {
  enabled: boolean;
  docsBasePath: string;
  llmDocsPath: string;
  staticDir?: string;
  requestDetection: NormalizedMarkdownRequestDetectionOptions;
  docsSourceFallback: NormalizedDocsSourceFallbackOptions;
}

export interface NormalizedMarkdownRequestDetectionOptions {
  acceptTypes: string[];
  headerNames: string[];
  headerValues: string[];
}

export interface NormalizedDocsSourceFallbackOptions {
  enabled: boolean;
  docsBasePaths: string[];
  metadataBaseDir: string;
  docsPluginIds: string[];
  cacheTtlMs: number;
}

/**
 * Fully normalized plugin options used by runtime code.
 */
export interface NormalizedGraphqlDocDocusaurusPluginOptions {
  id?: string;
  configPath?: string;
  schema?: SchemaSourceConfig;
  outputDir?: string;
  target?: string;
  allTargets: boolean;
  watch: boolean;
  cleanOutput?: boolean;
  llmDocs: boolean;
  llmDocsStrategy?: 'single' | 'chunked';
  llmDocsDepth?: 1 | 2 | 3 | 4 | 5;
  llmExamples: boolean;
  markdownRedirect: NormalizedMarkdownRedirectOptions;
  verbose: boolean;
  quiet: boolean;
}

const DEFAULT_MARKDOWN_ACCEPT_TYPES = ['text/markdown', 'text/x-markdown'];
const DEFAULT_MARKDOWN_HEADER_NAMES = [
  'x-accept-markdown',
  'x-doc-format',
  'x-format',
  'x-response-format',
  'x-return-format',
];
const DEFAULT_MARKDOWN_HEADER_VALUES = ['1', 'true', 'markdown', 'md', 'text/markdown'];
const DEFAULT_SOURCE_DOCS_BASE_PATHS = ['/docs'];
const DEFAULT_DOCS_METADATA_BASE_DIR = '.docusaurus/docusaurus-plugin-content-docs';
const DEFAULT_DOCS_PLUGIN_IDS = ['default'];
const DEFAULT_DOCS_METADATA_CACHE_TTL_MS = 2000;

function normalizeStringArray(values: string[] | undefined): string[] | undefined {
  if (!Array.isArray(values)) {
    return undefined;
  }

  const normalized = values.map((value) => value.trim()).filter(Boolean);
  return normalized.length > 0 ? normalized : [];
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
    target: options.target,
    allTargets: options.allTargets ?? false,
    watch: options.watch ?? false,
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
      requestDetection: {
        acceptTypes:
          normalizeStringArray(options.markdownRedirect?.requestDetection?.acceptTypes) ??
          DEFAULT_MARKDOWN_ACCEPT_TYPES,
        headerNames:
          normalizeStringArray(options.markdownRedirect?.requestDetection?.headerNames) ??
          DEFAULT_MARKDOWN_HEADER_NAMES,
        headerValues:
          normalizeStringArray(options.markdownRedirect?.requestDetection?.headerValues) ??
          DEFAULT_MARKDOWN_HEADER_VALUES,
      },
      docsSourceFallback: {
        enabled: options.markdownRedirect?.docsSourceFallback?.enabled ?? true,
        docsBasePaths:
          normalizeStringArray(options.markdownRedirect?.docsSourceFallback?.docsBasePaths) ??
          DEFAULT_SOURCE_DOCS_BASE_PATHS,
        metadataBaseDir:
          options.markdownRedirect?.docsSourceFallback?.metadataBaseDir ??
          DEFAULT_DOCS_METADATA_BASE_DIR,
        docsPluginIds:
          normalizeStringArray(options.markdownRedirect?.docsSourceFallback?.docsPluginIds) ??
          DEFAULT_DOCS_PLUGIN_IDS,
        cacheTtlMs:
          options.markdownRedirect?.docsSourceFallback?.cacheTtlMs ??
          DEFAULT_DOCS_METADATA_CACHE_TTL_MS,
      },
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

  if (options.target && options.allTargets) {
    throw new Error(
      'Invalid graphql-doc plugin options: target and allTargets cannot both be set.'
    );
  }

  if (!options.markdownRedirect.docsBasePath.trim()) {
    throw new Error('Invalid graphql-doc plugin options: markdownRedirect.docsBasePath is empty.');
  }

  if (!options.markdownRedirect.llmDocsPath.trim()) {
    throw new Error('Invalid graphql-doc plugin options: markdownRedirect.llmDocsPath is empty.');
  }

  if (options.markdownRedirect.requestDetection.acceptTypes.length === 0) {
    throw new Error(
      'Invalid graphql-doc plugin options: markdownRedirect.requestDetection.acceptTypes must contain at least one value.'
    );
  }

  if (options.markdownRedirect.requestDetection.headerNames.length === 0) {
    throw new Error(
      'Invalid graphql-doc plugin options: markdownRedirect.requestDetection.headerNames must contain at least one value.'
    );
  }

  if (options.markdownRedirect.requestDetection.headerValues.length === 0) {
    throw new Error(
      'Invalid graphql-doc plugin options: markdownRedirect.requestDetection.headerValues must contain at least one value.'
    );
  }

  const docsSourceFallback = options.markdownRedirect.docsSourceFallback;
  if (!Number.isFinite(docsSourceFallback.cacheTtlMs) || docsSourceFallback.cacheTtlMs < 0) {
    throw new Error(
      'Invalid graphql-doc plugin options: markdownRedirect.docsSourceFallback.cacheTtlMs must be a non-negative number.'
    );
  }

  if (docsSourceFallback.enabled) {
    if (docsSourceFallback.docsBasePaths.length === 0) {
      throw new Error(
        'Invalid graphql-doc plugin options: markdownRedirect.docsSourceFallback.docsBasePaths must contain at least one value when enabled.'
      );
    }

    if (!docsSourceFallback.metadataBaseDir.trim()) {
      throw new Error(
        'Invalid graphql-doc plugin options: markdownRedirect.docsSourceFallback.metadataBaseDir is empty.'
      );
    }

    if (docsSourceFallback.docsPluginIds.length === 0) {
      throw new Error(
        'Invalid graphql-doc plugin options: markdownRedirect.docsSourceFallback.docsPluginIds must contain at least one value when enabled.'
      );
    }
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
