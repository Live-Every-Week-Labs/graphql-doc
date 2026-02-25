import fs from 'node:fs';
import path from 'node:path';
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

const DEFAULT_CONFIG_CANDIDATES = [
  '.graphqlrc',
  '.graphql-docrc',
  '.graphql-docrc.json',
  '.graphql-docrc.yaml',
  '.graphql-docrc.yml',
  '.graphql-docrc.js',
  '.graphql-docrc.cjs',
  '.graphql-docrc.mjs',
  '.graphql-docrc.ts',
  'graphql-doc.config.js',
  'graphql-doc.config.cjs',
  'graphql-doc.config.mjs',
  'graphql-doc.config.ts',
  'graphql-doc.config.json',
];

function toArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value];
}

function normalizeWatchPath(input: string, targetDir: string): string | null {
  if (!input || /^https?:\/\//i.test(input)) {
    return null;
  }

  const absolute = path.isAbsolute(input) ? input : path.resolve(targetDir, input);
  const wildcardIndex = absolute.search(/[*?[{]/);
  const withoutGlob = wildcardIndex >= 0 ? absolute.slice(0, wildcardIndex) : absolute;
  const candidate = wildcardIndex >= 0 ? path.dirname(withoutGlob) : withoutGlob;

  let watchPath = candidate;
  while (!fs.existsSync(watchPath)) {
    const parent = path.dirname(watchPath);
    if (parent === watchPath) {
      return null;
    }
    watchPath = parent;
  }

  return watchPath;
}

function resolveConfigWatchSources(
  siteDir: string,
  options: NormalizedGraphqlDocDocusaurusPluginOptions
): string[] {
  if (options.configPath) {
    return [options.configPath];
  }

  return DEFAULT_CONFIG_CANDIDATES.map((candidate) => path.resolve(siteDir, candidate)).filter(
    (p) => fs.existsSync(p)
  );
}

/**
 * Build the filesystem targets that Docusaurus should watch in dev mode.
 *
 * The plugin always includes explicit schema/config pointers and the default
 * metadata root so schema/example changes can trigger re-generation.
 */
export function buildPluginWatchTargets(
  siteDir: string,
  options: NormalizedGraphqlDocDocusaurusPluginOptions
): string[] {
  const sources: string[] = [...resolveConfigWatchSources(siteDir, options), 'docs-metadata'];

  if (options.schema) {
    sources.push(...toArray(options.schema));
  }

  return Array.from(
    new Set(
      sources
        .map((entry) => normalizeWatchPath(entry, siteDir))
        .filter((entry): entry is string => Boolean(entry))
    )
  );
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
