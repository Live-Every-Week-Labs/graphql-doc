import path from 'path';
import { Config } from '../config/schema.js';

const GLOB_PATTERN_CHARS = /[*?[\]{}()!]/;

function isJsonFilePath(value: string): boolean {
  return path.extname(value).toLowerCase() === '.json';
}

export function toExampleGlobPattern(source: string): string {
  if (GLOB_PATTERN_CHARS.test(source) || isJsonFilePath(source)) {
    return source;
  }

  return path.join(source, '**/*.json');
}

export function getExampleSources(config: Config): string[] {
  if (config.exampleFiles && config.exampleFiles.length > 0) {
    return config.exampleFiles;
  }

  if (config.examplesDir) {
    return [config.examplesDir];
  }

  return [path.join(config.metadataDir, 'examples')];
}

export function getExamplePatterns(config: Config): string[] {
  return getExampleSources(config).map((source) => toExampleGlobPattern(source));
}
