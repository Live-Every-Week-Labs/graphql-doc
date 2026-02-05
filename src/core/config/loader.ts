import { cosmiconfig } from 'cosmiconfig';
import { loadConfig } from 'graphql-config';
import path from 'path';
import fs from 'fs';
import { Config, ConfigSchema } from './schema.js';

const MODULE_NAME = 'graphql-docs';

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
  'introDocs',
];

function normalizeConfigInput(input: unknown): unknown {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return input;
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

  let moved = false;
  for (const key of LEGACY_DOCUSAURUS_KEYS) {
    if (raw[key] !== undefined && docusaurus[key] === undefined) {
      docusaurus[key] = raw[key];
      moved = true;
    }
  }

  if (moved || adapters?.docusaurus !== undefined) {
    adapters.docusaurus = docusaurus;
  }

  const normalized: Record<string, unknown> = { ...raw, adapters };
  for (const key of LEGACY_DOCUSAURUS_KEYS) {
    delete normalized[key];
  }

  return normalized;
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
      throw new Error(`Config file not found: ${resolvedPath}`);
    }

    const explorer = cosmiconfig(MODULE_NAME);
    const result = await explorer.load(resolvedPath);

    if (result && result.config) {
      const normalized = normalizeConfigInput(result.config);
      return processConfigDefaults(ConfigSchema.parse(normalized));
    }

    throw new Error(`Failed to load config from: ${resolvedPath}`);
  }

  // 1. Try to load from .graphqlrc (graphql-config)
  try {
    const gqlConfig = await loadConfig({ rootDir: rootPath });
    if (gqlConfig) {
      const extensionConfig = gqlConfig.getDefault().extension(MODULE_NAME);

      if (extensionConfig) {
        const normalized = normalizeConfigInput(extensionConfig);
        return processConfigDefaults(ConfigSchema.parse(normalized));
      }
    }
  } catch (error) {
    console.warn(`Warning: Failed to load .graphqlrc: ${(error as Error).message}`);
    // Fall back to cosmiconfig
  }

  // 2. Try to load from cosmiconfig (graphql-docs.config.js, etc.)
  const explorer = cosmiconfig(MODULE_NAME);
  const result = await explorer.search(rootPath);

  if (result && result.config) {
    const normalized = normalizeConfigInput(result.config);
    return processConfigDefaults(ConfigSchema.parse(normalized));
  }

  // 3. Return default config
  return processConfigDefaults(ConfigSchema.parse({}));
}

function processConfigDefaults(config: Config): Config {
  // Smart defaults: If examples dir is not explicitly set,
  // assume it is a subdirectory of the metadataDir.
  // This allows users to just set `metadataDir` and get a standard structure.

  if (!config.examplesDir) {
    config.examplesDir = path.join(config.metadataDir, 'examples');
  }

  return config;
}

export function resolveConfigPaths(config: Config, rootPath: string): Config {
  const resolvePath = (value: string) =>
    path.isAbsolute(value) ? value : path.resolve(rootPath, value);

  const resolvedAdapters = { ...(config.adapters ?? {}) };
  const docusaurus = resolvedAdapters.docusaurus ? { ...resolvedAdapters.docusaurus } : undefined;
  const llmDocs = config.llmDocs ? { ...config.llmDocs } : undefined;

  if (docusaurus?.docsRoot) {
    docusaurus.docsRoot = resolvePath(docusaurus.docsRoot);
  }

  if (docusaurus?.introDocs && docusaurus.introDocs.length > 0) {
    docusaurus.introDocs = docusaurus.introDocs.map((doc) => {
      if (typeof doc === 'string') {
        return resolvePath(doc);
      }
      const source = resolvePath(doc.source);
      return { ...doc, source };
    });
  }

  if (docusaurus) {
    resolvedAdapters.docusaurus = docusaurus;
  }

  if (llmDocs?.outputDir) {
    llmDocs.outputDir = resolvePath(llmDocs.outputDir);
  }

  return {
    ...config,
    outputDir: resolvePath(config.outputDir),
    metadataDir: resolvePath(config.metadataDir),
    examplesDir: config.examplesDir ? resolvePath(config.examplesDir) : undefined,
    schemaExtensions: (config.schemaExtensions ?? []).map(resolvePath),
    adapters: resolvedAdapters,
    llmDocs: llmDocs ?? config.llmDocs,
  };
}
