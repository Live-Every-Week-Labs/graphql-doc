import fs from 'node:fs';
import path from 'node:path';
import { cosmiconfigSync } from 'cosmiconfig';
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
const MODULE_NAME = 'graphql-doc';
const UNSUPPORTED_SYNC_CONFIG_EXTENSIONS = new Set(['.js', '.cjs', '.mjs', '.ts']);
const EMPTY_WATCH_CONFIG: WatchConfigSources = {};

function toArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value];
}

interface WatchConfigSources {
  schema?: string | string[];
  examplesDir?: string;
  errorsDir?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function getNestedRecord(source: Record<string, unknown>, key: string): Record<string, unknown> {
  const value = source[key];
  return isRecord(value) ? value : {};
}

function getNestedString(source: Record<string, unknown>, key: string): string | undefined {
  const value = source[key];
  return typeof value === 'string' ? value : undefined;
}

function getNestedStringOrArray(
  source: Record<string, unknown>,
  key: string
): string | string[] | undefined {
  const value = source[key];
  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value) && value.every((entry) => typeof entry === 'string')) {
    return value;
  }

  return undefined;
}

function supportsSyncWatchConfig(configPath: string): boolean {
  const ext = path.extname(configPath).toLowerCase();
  return !UNSUPPORTED_SYNC_CONFIG_EXTENSIONS.has(ext);
}

function readWatchConfigSources(rawConfig: unknown): WatchConfigSources {
  if (!isRecord(rawConfig)) {
    return EMPTY_WATCH_CONFIG;
  }

  const rootConfig = rawConfig;
  const extensions = getNestedRecord(rootConfig, 'extensions');
  const extensionConfig = getNestedRecord(extensions, MODULE_NAME);
  const source = Object.keys(extensionConfig).length > 0 ? extensionConfig : rootConfig;
  const examples = getNestedRecord(source, 'examples');
  const errors = getNestedRecord(source, 'errors');

  const schema =
    getNestedStringOrArray(source, 'schema') ?? getNestedStringOrArray(rootConfig, 'schema');
  const examplesDir = getNestedString(source, 'examplesDir') ?? getNestedString(examples, 'dir');
  const errorsDir = getNestedString(source, 'errorsDir') ?? getNestedString(errors, 'dir');

  return {
    schema,
    examplesDir,
    errorsDir,
  };
}

function loadGeneratorConfigSync(
  siteDir: string,
  options: NormalizedGraphqlDocDocusaurusPluginOptions
): WatchConfigSources {
  const explorer = cosmiconfigSync(MODULE_NAME);
  const candidatePaths = resolveConfigWatchSources(siteDir, options);

  for (const configPath of candidatePaths) {
    const resolvedPath = path.isAbsolute(configPath)
      ? configPath
      : path.resolve(siteDir, configPath);
    if (!fs.existsSync(resolvedPath) || !supportsSyncWatchConfig(resolvedPath)) {
      continue;
    }

    try {
      const loaded = explorer.load(resolvedPath);
      if (loaded?.config) {
        return readWatchConfigSources(loaded.config);
      }
    } catch {
      // Skip malformed or unsupported config payloads. Base watch targets are
      // still returned from explicit options and file-level config candidates.
    }
  }

  return EMPTY_WATCH_CONFIG;
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

  const configSources = loadGeneratorConfigSync(siteDir, options);
  if (configSources.schema) {
    sources.push(...toArray(configSources.schema));
  }
  if (configSources.examplesDir) {
    sources.push(configSources.examplesDir);
  }
  if (configSources.errorsDir) {
    sources.push(configSources.errorsDir);
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
