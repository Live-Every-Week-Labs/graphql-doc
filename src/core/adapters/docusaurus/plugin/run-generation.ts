import path from 'path';
import { loadConfig } from 'graphql-config';
import { loadGeneratorConfig, resolveConfigPaths } from '../../../config/loader.js';
import type { Config } from '../../../config/schema.js';
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

function resolveSchemaPointers(
  schemaPointer: string | string[],
  siteDir: string
): string | string[] {
  const resolvePointer = (pointer: string) => {
    const isRemoteSchema = /^https?:\/\//i.test(pointer);
    return isRemoteSchema || path.isAbsolute(pointer) ? pointer : path.resolve(siteDir, pointer);
  };

  return Array.isArray(schemaPointer)
    ? schemaPointer.map(resolvePointer)
    : resolvePointer(schemaPointer);
}

async function resolveSchemaPointer(
  schemaOption: string | string[] | undefined,
  siteDir: string
): Promise<string | string[]> {
  if (schemaOption) {
    return schemaOption;
  }

  try {
    const gqlConfig = await loadConfig({ rootDir: siteDir });
    if (gqlConfig) {
      const project = gqlConfig.getDefault();
      const schemaFromConfig = project.schema;

      if (typeof schemaFromConfig === 'string') {
        return schemaFromConfig;
      }

      if (Array.isArray(schemaFromConfig)) {
        const stringSchemas = schemaFromConfig.filter(
          (pointer): pointer is string => typeof pointer === 'string'
        );
        if (stringSchemas.length > 0) {
          return stringSchemas;
        }
      }
    }
  } catch {
    // If graphql-config is absent or malformed, the generator's schema loading
    // step will emit a clear error from the final resolved pointer.
  }

  return 'schema.graphql';
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

  const schemaPointer = await resolveSchemaPointer(options.schema, siteDir);
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
