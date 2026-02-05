import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { loadGeneratorConfig } from './loader.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('loadGeneratorConfig', () => {
  it('loads default config when no config file exists', async () => {
    const config = await loadGeneratorConfig();
    expect(config.outputDir).toBe('./docs/api');
    expect(config.framework).toBe('docusaurus');
    expect(config.adapters.docusaurus).toBeDefined();
  });

  describe('custom config path', () => {
    let tempDir: string;
    let configPath: string;

    beforeAll(() => {
      // Create temp directory and config file
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'graphql-docs-test-'));
      configPath = path.join(tempDir, 'custom-config.json');
      fs.writeFileSync(
        configPath,
        JSON.stringify({
          outputDir: './custom-output',
          framework: 'docusaurus',
          adapters: {
            docusaurus: {
              singlePage: true,
            },
          },
        })
      );
    });

    afterAll(() => {
      // Cleanup temp directory
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it('loads config from custom path', async () => {
      const config = await loadGeneratorConfig(process.cwd(), configPath);
      expect(config.outputDir).toBe('./custom-output');
      expect(config.adapters.docusaurus.singlePage).toBe(true);
    });

    it('maps legacy Docusaurus keys into adapters', async () => {
      const legacyPath = path.join(tempDir, 'legacy-config.json');
      fs.writeFileSync(
        legacyPath,
        JSON.stringify({
          outputDir: './legacy-output',
          singlePage: true,
        })
      );

      const config = await loadGeneratorConfig(process.cwd(), legacyPath);
      expect(config.outputDir).toBe('./legacy-output');
      expect(config.adapters.docusaurus.singlePage).toBe(true);
    });

    it('throws error when config file not found', async () => {
      const nonExistentPath = '/path/to/non-existent/config.json';
      await expect(loadGeneratorConfig(process.cwd(), nonExistentPath)).rejects.toThrow(
        `Config file not found: ${nonExistentPath}`
      );
    });

    it('resolves relative config paths from rootPath', async () => {
      const relativePath = path.basename(configPath);
      const config = await loadGeneratorConfig(tempDir, relativePath);
      expect(config.outputDir).toBe('./custom-output');
    });

    it('supports exampleFiles as an array and requireExamplesForDocumentedOperations', async () => {
      const configWithExamplesPath = path.join(tempDir, 'example-files-config.json');
      fs.writeFileSync(
        configWithExamplesPath,
        JSON.stringify({
          outputDir: './docs',
          framework: 'docusaurus',
          metadataDir: './docs-metadata',
          exampleFiles: ['./metadata/examples/queries.json', './metadata/examples/mutations.json'],
          requireExamplesForDocumentedOperations: true,
        })
      );

      const config = await loadGeneratorConfig(process.cwd(), configWithExamplesPath);
      expect(config.exampleFiles).toEqual([
        './metadata/examples/queries.json',
        './metadata/examples/mutations.json',
      ]);
      expect(config.examplesDir).toBeUndefined();
      expect(config.requireExamplesForDocumentedOperations).toBe(true);
    });

    it('normalizes single exampleFiles value to an array', async () => {
      const singleSourcePath = path.join(tempDir, 'example-files-single.json');
      fs.writeFileSync(
        singleSourcePath,
        JSON.stringify({
          outputDir: './docs',
          framework: 'docusaurus',
          metadataDir: './docs-metadata',
          exampleFiles: './metadata/examples/all.json',
        })
      );

      const config = await loadGeneratorConfig(process.cwd(), singleSourcePath);
      expect(config.exampleFiles).toEqual(['./metadata/examples/all.json']);
      expect(config.examplesDir).toBeUndefined();
    });
  });
});
