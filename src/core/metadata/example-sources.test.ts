import { describe, it, expect } from 'vitest';
import { getExamplePatterns, getExampleSources, toExampleGlobPattern } from './example-sources.js';
import { createTestConfig } from '../../test/test-utils.js';

function createConfig(overrides: Parameters<typeof createTestConfig>[0] = {}) {
  return createTestConfig(overrides);
}

describe('example-sources', () => {
  it('uses explicit exampleFiles when provided', () => {
    const config = createConfig({
      exampleFiles: ['./examples/queries/*.json', './examples/mutations/*.json'],
      examplesDir: undefined,
    });

    expect(getExampleSources(config)).toEqual([
      './examples/queries/*.json',
      './examples/mutations/*.json',
    ]);
  });

  it('falls back to examplesDir when exampleFiles is not set', () => {
    const config = createConfig({
      exampleFiles: undefined,
      examplesDir: './custom-examples',
    });

    expect(getExampleSources(config)).toEqual(['./custom-examples']);
    expect(getExamplePatterns(config)).toEqual(['custom-examples/**/*.json']);
  });

  it('falls back to metadataDir/examples when no source is set', () => {
    const config = createConfig({
      exampleFiles: undefined,
      examplesDir: undefined,
      metadataDir: './meta',
    });

    expect(getExamplePatterns(config)).toEqual(['meta/examples/**/*.json']);
  });

  it('preserves json file paths and glob patterns', () => {
    expect(toExampleGlobPattern('./examples/single.json')).toBe('./examples/single.json');
    expect(toExampleGlobPattern('./examples/**/*.json')).toBe('./examples/**/*.json');
  });
});
