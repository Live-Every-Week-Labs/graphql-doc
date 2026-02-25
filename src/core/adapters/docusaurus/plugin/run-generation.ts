import { loadGeneratorConfig, resolveConfigPaths } from '../../../config/loader.js';
import type { Config } from '../../../config/schema.js';
import { resolveSchemaPointer, resolveSchemaPointers } from '../../../config/schema-pointer.js';
import { Generator } from '../../../generator.js';
import type { Logger } from '../../../logger.js';
import type { NormalizedGraphqlDocDocusaurusPluginOptions } from './options.js';

export interface PluginGenerationContext {
  siteDir: string;
  options: NormalizedGraphqlDocDocusaurusPluginOptions;
}

export interface PluginGenerationResult {
  schemaPointer: string | string[];
  outputDir: string;
  llmOutputDir?: string;
  filesWritten: number;
  llmFilesWritten: number;
}

function createPluginLogger(options: { quiet: boolean; verbose: boolean }): Logger {
  return {
    info(message: string): void {
      if (options.quiet || !options.verbose) {
        return;
      }
      console.log(`[graphql-doc] ${message}`);
    },
    warn(message: string): void {
      if (options.quiet) {
        return;
      }
      console.warn(`[graphql-doc] Warning: ${message}`);
    },
  };
}

function applyPluginOverrides(
  config: Config,
  options: NormalizedGraphqlDocDocusaurusPluginOptions
): Config {
  const updated: Config = {
    ...config,
    llmDocs: {
      ...config.llmDocs,
      enabled: options.llmDocs,
      includeExamples: options.llmExamples,
    },
  };

  if (options.outputDir) {
    updated.outputDir = options.outputDir;
  }

  if (options.cleanOutput !== undefined) {
    updated.cleanOutputDir = options.cleanOutput;
  }

  if (options.llmDocsStrategy) {
    updated.llmDocs.strategy = options.llmDocsStrategy;
  }

  if (options.llmDocsDepth) {
    updated.llmDocs.maxTypeDepth = options.llmDocsDepth;
  }

  return updated;
}

/**
 * Run a single graphql-doc generation pass from the Docusaurus plugin.
 *
 * This intentionally mirrors CLI behavior: load config, apply explicit
 * runtime overrides, resolve schema pointers, then execute the Generator.
 */
export async function runPluginGeneration(
  context: PluginGenerationContext
): Promise<PluginGenerationResult> {
  const { siteDir, options } = context;
  const logger = createPluginLogger({ quiet: options.quiet, verbose: options.verbose });

  let config = await loadGeneratorConfig(siteDir, options.configPath);
  config = applyPluginOverrides(config, options);
  config = resolveConfigPaths(config, siteDir);

  const schemaPointer = await resolveSchemaPointer({ schema: options.schema }, siteDir, {
    silent: !options.verbose,
    log: (message) => logger.info(message),
  });
  const resolvedSchemaPointer = resolveSchemaPointers(schemaPointer, siteDir);

  const generator = new Generator(config, logger);
  const result = await generator.generate(resolvedSchemaPointer, { dryRun: false });

  return {
    schemaPointer: resolvedSchemaPointer,
    outputDir: config.outputDir,
    llmOutputDir: config.llmDocs.enabled ? config.llmDocs.outputDir : undefined,
    filesWritten: result.filesWritten,
    llmFilesWritten: result.llmFilesWritten,
  };
}
