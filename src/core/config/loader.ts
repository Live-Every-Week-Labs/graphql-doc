import { cosmiconfig } from 'cosmiconfig';
import { loadConfig } from 'graphql-config';
import path from 'path';
import fs from 'fs';
import { Config, ConfigSchema } from './schema.js';

const MODULE_NAME = 'graphql-docs';

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
      return processConfigDefaults(ConfigSchema.parse(result.config));
    }

    throw new Error(`Failed to load config from: ${resolvedPath}`);
  }

  // 1. Try to load from .graphqlrc (graphql-config)
  try {
    const gqlConfig = await loadConfig({ rootDir: rootPath });
    if (gqlConfig) {
      const extensionConfig = gqlConfig.getDefault().extension(MODULE_NAME);

      if (extensionConfig) {
        return processConfigDefaults(ConfigSchema.parse(extensionConfig));
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
    return processConfigDefaults(ConfigSchema.parse(result.config));
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
