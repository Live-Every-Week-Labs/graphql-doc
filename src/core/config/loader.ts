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

  const resolveIntroDocs = (introDocs: Config['introDocs']) => {
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
    introDocs: resolveIntroDocs(config.introDocs),
    metadataDir: resolvePath(config.metadataDir),
    examplesDir: config.examplesDir ? resolvePath(config.examplesDir) : undefined,
    exampleFiles: config.exampleFiles?.map(resolvePath),
    schemaExtensions: (config.schemaExtensions ?? []).map(resolvePath),
    agentSkill: agentSkill ?? config.agentSkill,
    adapters: resolvedAdapters,
    llmDocs: llmDocs ?? config.llmDocs,
  };
}
