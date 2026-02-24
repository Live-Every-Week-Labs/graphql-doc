import { cosmiconfig } from 'cosmiconfig';
import { loadConfig } from 'graphql-config';
import path from 'path';
import fs from 'fs';
import { Config, ConfigSchema, CURRENT_CONFIG_VERSION } from './schema.js';
import { formatPathForMessage } from '../utils/index.js';

const MODULE_NAME = 'graphql-docs';
const CONFIG_SCHEMA_KEYS: Set<string> = new Set(ConfigSchema.keyof().options as readonly string[]);

const LEGACY_DOCUSAURUS_KEYS = [
  'singlePage',
  'docsRoot',
  'docIdPrefix',
  'unsafeMdxDescriptions',
  'typeLinkMode',
  'generateSidebar',
  'sidebarFile',
  'sidebarCategoryIndex',
  'sidebarMerge',
  'sidebarTarget',
  'sidebarInsertPosition',
  'sidebarInsertReference',
  'sidebarSectionLabels',
];

interface MigrationResult {
  config: unknown;
  warnings: string[];
}

function normalizeConfigInput(input: unknown): MigrationResult {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { config: input, warnings: [] };
  }

  const raw = input as Record<string, unknown>;
  const adaptersRaw = raw.adapters;
  const adapters =
    adaptersRaw && typeof adaptersRaw === 'object' && !Array.isArray(adaptersRaw)
      ? { ...(adaptersRaw as Record<string, unknown>) }
      : {};
  const docusaurusRaw = adapters.docusaurus;
  const docusaurus =
    docusaurusRaw && typeof docusaurusRaw === 'object' && !Array.isArray(docusaurusRaw)
      ? { ...(docusaurusRaw as Record<string, unknown>) }
      : {};

  const warnings: string[] = [];
  let moved = false;
  for (const key of LEGACY_DOCUSAURUS_KEYS) {
    if (raw[key] !== undefined && docusaurus[key] === undefined) {
      docusaurus[key] = raw[key];
      moved = true;
      warnings.push(
        `Config key "${key}" is deprecated at root level. Use adapters.docusaurus.${key} instead.`
      );
    }
  }

  if (moved || adapters?.docusaurus !== undefined) {
    adapters.docusaurus = docusaurus;
  }

  const normalized: Record<string, unknown> = { ...raw, adapters };
  for (const key of LEGACY_DOCUSAURUS_KEYS) {
    delete normalized[key];
  }

  return { config: normalized, warnings };
}

function migrateConfigInput(input: unknown): MigrationResult {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { config: input, warnings: [] };
  }

  const raw = input as Record<string, unknown>;
  const warnings: string[] = [];
  const configVersionRaw = raw.configVersion;
  const configVersion = typeof configVersionRaw === 'number' ? configVersionRaw : 0;

  if (!Number.isInteger(configVersion) || configVersion < 0) {
    throw new Error(
      `Invalid configVersion: ${String(configVersionRaw)}. Expected ${CURRENT_CONFIG_VERSION}.`
    );
  }

  if (configVersion > CURRENT_CONFIG_VERSION) {
    throw new Error(
      `Unsupported configVersion: ${configVersion}. This CLI supports up to ${CURRENT_CONFIG_VERSION}.`
    );
  }

  const migrated: Record<string, unknown> = { ...raw };
  const adaptersRaw = migrated.adapters;
  const adapters =
    adaptersRaw && typeof adaptersRaw === 'object' && !Array.isArray(adaptersRaw)
      ? { ...(adaptersRaw as Record<string, unknown>) }
      : {};
  const docusaurusRaw = adapters.docusaurus;
  const docusaurus =
    docusaurusRaw && typeof docusaurusRaw === 'object' && !Array.isArray(docusaurusRaw)
      ? { ...(docusaurusRaw as Record<string, unknown>) }
      : {};

  const rootIntroDocs = migrated.introDocs;
  if (rootIntroDocs !== undefined) {
    const existingAdapterIntroDocs = docusaurus.introDocs;
    if (existingAdapterIntroDocs === undefined) {
      docusaurus.introDocs = rootIntroDocs;
    } else if (Array.isArray(existingAdapterIntroDocs) && Array.isArray(rootIntroDocs)) {
      docusaurus.introDocs = [...rootIntroDocs, ...existingAdapterIntroDocs];
    }

    delete migrated.introDocs;
    warnings.push(
      'Root-level introDocs is deprecated and now treated as adapters.docusaurus.introDocs.'
    );
  }

  adapters.docusaurus = docusaurus;
  migrated.adapters = adapters;

  if (configVersion < CURRENT_CONFIG_VERSION || migrated.configVersion === undefined) {
    warnings.push(
      `Config migrated to version ${CURRENT_CONFIG_VERSION}. Add "configVersion: ${CURRENT_CONFIG_VERSION}" to your config to silence this warning.`
    );
  }

  migrated.configVersion = CURRENT_CONFIG_VERSION;

  return { config: migrated, warnings };
}

function emitMigrationWarnings(warnings: string[], sourceLabel: string): void {
  for (const warning of warnings) {
    console.warn(`Warning: ${warning} (${sourceLabel})`);
  }
}

function collectStrippedKeyWarnings(input: unknown): string[] {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return [];
  }

  const rootKeys = Object.keys(input);
  return rootKeys
    .filter((key) => !CONFIG_SCHEMA_KEYS.has(key))
    .map((key) => `Unknown config key "${key}" will be ignored.`);
}

function parseLoadedConfig(rawConfig: unknown, sourceLabel: string): Config {
  const normalization = normalizeConfigInput(rawConfig);
  const migration = migrateConfigInput(normalization.config);
  const strippedKeyWarnings = collectStrippedKeyWarnings(migration.config);
  const allWarnings = [...normalization.warnings, ...migration.warnings, ...strippedKeyWarnings];
  if (allWarnings.length > 0) {
    emitMigrationWarnings(allWarnings, sourceLabel);
  }

  return processConfigDefaults(ConfigSchema.parse(migration.config));
}

export async function loadGeneratorConfig(
  rootPath: string = process.cwd(),
  configPath?: string
): Promise<Config> {
  // If explicit config path provided, load from that path
  if (configPath) {
    const resolvedPath = path.isAbsolute(configPath)
      ? configPath
      : path.resolve(rootPath, configPath);

    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Config file not found: ${formatPathForMessage(resolvedPath, rootPath)}`);
    }

    const explorer = cosmiconfig(MODULE_NAME);
    const result = await explorer.load(resolvedPath);

    if (result && result.config) {
      return parseLoadedConfig(result.config, formatPathForMessage(resolvedPath, rootPath));
    }

    throw new Error(`Failed to load config from: ${formatPathForMessage(resolvedPath, rootPath)}`);
  }

  // 1. Try to load from .graphqlrc (graphql-config)
  try {
    const gqlConfig = await loadConfig({ rootDir: rootPath });
    if (gqlConfig) {
      const extensionConfig = gqlConfig.getDefault().extension(MODULE_NAME);

      if (extensionConfig) {
        return parseLoadedConfig(extensionConfig, '.graphqlrc extensions.graphql-docs');
      }
    }
  } catch {
    console.warn(
      'Warning: Failed to load .graphqlrc configuration. Falling back to graphql-docs config discovery.'
    );
    // Fall back to cosmiconfig
  }

  // 2. Try to load from cosmiconfig (graphql-docs.config.js, etc.)
  const explorer = cosmiconfig(MODULE_NAME);
  const result = await explorer.search(rootPath);

  if (result && result.config) {
    const sourceLabel = result.filepath
      ? formatPathForMessage(result.filepath, rootPath)
      : 'graphql-docs config';
    return parseLoadedConfig(result.config, sourceLabel);
  }

  // 3. Return default config
  return processConfigDefaults(ConfigSchema.parse({}));
}

function processConfigDefaults(config: Config): Config {
  // Smart defaults: If explicit example file sources are not configured
  // and examplesDir is missing, assume examples live under metadataDir/examples.
  if (!config.exampleFiles?.length && !config.examplesDir) {
    config.examplesDir = path.join(config.metadataDir, 'examples');
  }

  if (config.agentSkill?.enabled && !config.agentSkill.outputDir) {
    config.agentSkill.outputDir = path.join(
      config.outputDir,
      'agent-skills',
      config.agentSkill.name
    );
  }

  return config;
}

export function resolveConfigPaths(config: Config, rootPath: string): Config {
  const resolvePath = (value: string) =>
    path.isAbsolute(value) ? value : path.resolve(rootPath, value);

  const resolvedAdapters = { ...(config.adapters ?? {}) };
  const docusaurus = resolvedAdapters.docusaurus ? { ...resolvedAdapters.docusaurus } : undefined;
  const llmDocs = config.llmDocs ? { ...config.llmDocs } : undefined;
  const agentSkill = config.agentSkill ? { ...config.agentSkill } : undefined;

  const resolveIntroDocs = (
    introDocs: NonNullable<Config['adapters']['docusaurus']>['introDocs']
  ) => {
    if (!introDocs || introDocs.length === 0) {
      return introDocs;
    }

    return introDocs.map((doc) => {
      if (typeof doc === 'string') {
        return resolvePath(doc);
      }

      if (doc.source) {
        return { ...doc, source: resolvePath(doc.source) };
      }

      return doc;
    });
  };

  if (docusaurus?.docsRoot) {
    docusaurus.docsRoot = resolvePath(docusaurus.docsRoot);
  }

  if (docusaurus?.introDocs && docusaurus.introDocs.length > 0) {
    docusaurus.introDocs = resolveIntroDocs(docusaurus.introDocs);
  }

  if (docusaurus) {
    resolvedAdapters.docusaurus = docusaurus;
  }

  if (llmDocs?.outputDir) {
    llmDocs.outputDir = resolvePath(llmDocs.outputDir);
  }

  if (agentSkill?.outputDir) {
    agentSkill.outputDir = resolvePath(agentSkill.outputDir);
  }

  return {
    ...config,
    outputDir: resolvePath(config.outputDir),
    metadataDir: resolvePath(config.metadataDir),
    examplesDir: config.examplesDir ? resolvePath(config.examplesDir) : undefined,
    exampleFiles: config.exampleFiles?.map(resolvePath),
    schemaExtensions: (config.schemaExtensions ?? []).map(resolvePath),
    agentSkill: agentSkill ?? config.agentSkill,
    adapters: resolvedAdapters,
    llmDocs: llmDocs ?? config.llmDocs,
  };
}
