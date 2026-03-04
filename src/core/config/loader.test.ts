import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
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
    expect(config.groupOrdering).toEqual({ mode: 'alphabetical' });
  });

  describe('custom config path', () => {
    let tempDir: string;
    let configPath: string;

    beforeAll(() => {
      // Create temp directory and config file
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'graphql-doc-test-'));
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

    it('accepts explicit group ordering mode with explicitOrder', async () => {
      const explicitPath = path.join(tempDir, 'group-ordering-explicit.json');
      fs.writeFileSync(
        explicitPath,
        JSON.stringify({
          outputDir: './docs',
          framework: 'docusaurus',
          groupOrdering: {
            mode: 'explicit',
            explicitOrder: ['Core', 'Payments'],
          },
        })
      );

      const config = await loadGeneratorConfig(process.cwd(), explicitPath);
      expect(config.groupOrdering.mode).toBe('explicit');
      if (config.groupOrdering.mode === 'explicit') {
        expect(config.groupOrdering.explicitOrder).toEqual(['Core', 'Payments']);
      }
    });

    it('throws when explicit group ordering mode omits explicitOrder', async () => {
      const explicitMissingPath = path.join(tempDir, 'group-ordering-explicit-missing.json');
      fs.writeFileSync(
        explicitMissingPath,
        JSON.stringify({
          outputDir: './docs',
          framework: 'docusaurus',
          groupOrdering: {
            mode: 'explicit',
          },
        })
      );

      await expect(loadGeneratorConfig(process.cwd(), explicitMissingPath)).rejects.toThrow(
        'explicitOrder'
      );
    });

    it('throws when explicit group ordering mode provides an empty explicitOrder', async () => {
      const explicitEmptyPath = path.join(tempDir, 'group-ordering-explicit-empty.json');
      fs.writeFileSync(
        explicitEmptyPath,
        JSON.stringify({
          outputDir: './docs',
          framework: 'docusaurus',
          groupOrdering: {
            mode: 'explicit',
            explicitOrder: [],
          },
        })
      );

      await expect(loadGeneratorConfig(process.cwd(), explicitEmptyPath)).rejects.toThrow(
        'at least 1'
      );
    });

    it('throws when pinned ordering duplicates normalized group names across start and end', async () => {
      const pinnedOverlapPath = path.join(tempDir, 'group-ordering-pinned-overlap.json');
      fs.writeFileSync(
        pinnedOverlapPath,
        JSON.stringify({
          outputDir: './docs',
          framework: 'docusaurus',
          groupOrdering: {
            mode: 'pinned',
            pinToStart: ['Deprecated Payments'],
            pinToEnd: ['  deprecated_payments  '],
          },
        })
      );

      await expect(loadGeneratorConfig(process.cwd(), pinnedOverlapPath)).rejects.toThrow(
        'cannot contain the same normalized group name'
      );
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
        'Config file not found: config.json'
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

    it('parses top-level schema and targets without stripping them', async () => {
      const targetsPath = path.join(tempDir, 'targets-config.json');
      fs.writeFileSync(
        targetsPath,
        JSON.stringify({
          configVersion: 1,
          schema: './schema/root.graphql',
          outputDir: './docs/api',
          framework: 'docusaurus',
          targets: [
            {
              name: 'main',
              schema: './schema/prod.graphql',
              outputDir: './docs/api',
            },
            {
              name: 'lab',
              enabled: false,
              schema: {
                primary: './schema/beta.graphql',
                fallback: './schema/prod.graphql',
              },
              outputDir: './versioned_docs/version-lab/api',
              llmDocs: {
                enabled: false,
              },
            },
          ],
        })
      );

      const config = await loadGeneratorConfig(process.cwd(), targetsPath);
      expect(config.schema).toBe('./schema/root.graphql');
      expect(config.targets).toHaveLength(2);
      expect(config.targets?.[0].name).toBe('main');
      expect(config.targets?.[0].enabled).toBe(true);
      expect(config.targets?.[1].enabled).toBe(false);
      expect(config.targets?.[1].schema).toEqual({
        primary: './schema/beta.graphql',
        fallback: './schema/prod.graphql',
      });
      expect(config.targets?.[1].llmDocs?.enabled).toBe(false);
    });

    it('throws when target names are duplicated case-insensitively', async () => {
      const duplicateTargetsPath = path.join(tempDir, 'duplicate-targets-config.json');
      fs.writeFileSync(
        duplicateTargetsPath,
        JSON.stringify({
          configVersion: 1,
          outputDir: './docs/api',
          framework: 'docusaurus',
          targets: [
            {
              name: 'main',
              outputDir: './docs/api',
            },
            {
              name: 'Main',
              outputDir: './docs/api-lab',
            },
          ],
        })
      );

      await expect(loadGeneratorConfig(process.cwd(), duplicateTargetsPath)).rejects.toThrow(
        'Duplicate target name'
      );
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

    it('throws for unsupported future configVersion values', async () => {
      const versionedPath = path.join(tempDir, 'future-version-config.json');
      fs.writeFileSync(
        versionedPath,
        JSON.stringify({
          configVersion: 99,
          outputDir: './docs',
        })
      );

      await expect(loadGeneratorConfig(process.cwd(), versionedPath)).rejects.toThrow(
        'Unsupported configVersion'
      );
    });

    it('throws for invalid configVersion values', async () => {
      const versionedPath = path.join(tempDir, 'invalid-version-config.json');
      fs.writeFileSync(
        versionedPath,
        JSON.stringify({
          configVersion: -1,
          outputDir: './docs',
        })
      );

      await expect(loadGeneratorConfig(process.cwd(), versionedPath)).rejects.toThrow(
        'Invalid configVersion'
      );
    });

    it('warns when unknown root config keys are stripped', async () => {
      const warningPath = path.join(tempDir, 'unknown-key-config.json');
      fs.writeFileSync(
        warningPath,
        JSON.stringify({
          configVersion: 1,
          outputDir: './docs',
          framework: 'docusaurus',
          unknownConfigKey: true,
        })
      );

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      try {
        const config = await loadGeneratorConfig(process.cwd(), warningPath);
        expect(
          (config as unknown as { unknownConfigKey?: unknown }).unknownConfigKey
        ).toBeUndefined();
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining('Unknown config key "unknownConfigKey" will be ignored.')
        );
      } finally {
        warnSpy.mockRestore();
      }
    });

    it('throws a schema error for unsupported framework values', async () => {
      const invalidFrameworkPath = path.join(tempDir, 'invalid-framework-config.json');
      fs.writeFileSync(
        invalidFrameworkPath,
        JSON.stringify({
          configVersion: 1,
          outputDir: './docs',
          framework: 'nextjs',
        })
      );

      await expect(loadGeneratorConfig(process.cwd(), invalidFrameworkPath)).rejects.toThrow(
        'Invalid enum value'
      );
    });

    it('migrates root-level introDocs to adapters.docusaurus.introDocs', async () => {
      const introDocsPath = path.join(tempDir, 'intro-docs-config.json');
      fs.writeFileSync(
        introDocsPath,
        JSON.stringify({
          outputDir: './docs',
          framework: 'docusaurus',
          introDocs: ['./docs/intro/overview.mdx'],
        })
      );

      const config = await loadGeneratorConfig(process.cwd(), introDocsPath);
      expect((config as unknown as { introDocs?: unknown }).introDocs).toBeUndefined();
      expect(config.adapters.docusaurus.introDocs).toEqual(['./docs/intro/overview.mdx']);
    });

    it('sets a default agentSkill outputDir when enabled', async () => {
      const agentSkillPath = path.join(tempDir, 'agent-skill-config.json');
      fs.writeFileSync(
        agentSkillPath,
        JSON.stringify({
          outputDir: './docs/api',
          framework: 'docusaurus',
          agentSkill: {
            enabled: true,
            name: 'docs-skill',
          },
        })
      );

      const config = await loadGeneratorConfig(process.cwd(), agentSkillPath);
      expect(config.agentSkill.enabled).toBe(true);
      expect(config.agentSkill.outputDir).toBe(
        path.join('./docs/api', 'agent-skills', 'docs-skill')
      );
    });

    it('loads agentSkill intro doc title and description', async () => {
      const agentSkillIntroPath = path.join(tempDir, 'agent-skill-intro-config.json');
      fs.writeFileSync(
        agentSkillIntroPath,
        JSON.stringify({
          outputDir: './docs/api',
          framework: 'docusaurus',
          agentSkill: {
            enabled: true,
            name: 'docs-skill',
            introDoc: {
              title: 'Integration Skill',
              description: 'Download and install this skill package.',
            },
          },
        })
      );

      const config = await loadGeneratorConfig(process.cwd(), agentSkillIntroPath);
      expect(config.agentSkill.introDoc.title).toBe('Integration Skill');
      expect(config.agentSkill.introDoc.description).toBe(
        'Download and install this skill package.'
      );
    });
  });
});
