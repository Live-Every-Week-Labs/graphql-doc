import { describe, expect, it } from 'vitest';
import { ConfigSchema } from './schema.js';
import { buildTargetExecutionPlan, hasConfiguredTargets } from './targets.js';

describe('target execution planning', () => {
  it('returns a legacy single run when no targets are configured', () => {
    const config = ConfigSchema.parse({
      configVersion: 1,
      outputDir: './docs/api',
      framework: 'docusaurus',
    });

    const plans = buildTargetExecutionPlan(config);

    expect(plans).toHaveLength(1);
    expect(plans[0].isTargetedRun).toBe(false);
    expect(plans[0].targetName).toBe('default');
    expect(plans[0].config.outputDir).toBe('./docs/api');
    expect(plans[0].config.targets).toBeUndefined();
  });

  it('returns enabled targets by default', () => {
    const config = ConfigSchema.parse({
      configVersion: 1,
      outputDir: './docs/api',
      framework: 'docusaurus',
      targets: [
        {
          name: 'prod',
          outputDir: './docs/api',
        },
        {
          name: 'beta',
          enabled: false,
          outputDir: './versioned_docs/version-lab/api',
        },
        {
          name: 'labs',
          outputDir: './versioned_docs/version-labs/api',
        },
      ],
    });

    const plans = buildTargetExecutionPlan(config);

    expect(plans.map((plan) => plan.targetName)).toEqual(['prod', 'labs']);
  });

  it('supports case-insensitive alias target selection', () => {
    const config = ConfigSchema.parse({
      configVersion: 1,
      outputDir: './docs/api',
      framework: 'docusaurus',
      targets: [
        {
          name: 'Beta Release',
          outputDir: './versioned_docs/version-lab/api',
        },
      ],
    });

    const plans = buildTargetExecutionPlan(config, {
      target: 'beta-release',
    });

    expect(plans).toHaveLength(1);
    expect(plans[0].targetName).toBe('Beta Release');
  });

  it('throws when a selected target does not exist', () => {
    const config = ConfigSchema.parse({
      configVersion: 1,
      outputDir: './docs/api',
      framework: 'docusaurus',
      targets: [{ name: 'prod', outputDir: './docs/api' }],
    });

    expect(() =>
      buildTargetExecutionPlan(config, {
        target: 'missing',
      })
    ).toThrow('Unknown target');
  });

  it('throws when an explicitly selected target is disabled', () => {
    const config = ConfigSchema.parse({
      configVersion: 1,
      outputDir: './docs/api',
      framework: 'docusaurus',
      targets: [{ name: 'beta', enabled: false, outputDir: './versioned_docs/version-lab/api' }],
    });

    expect(() =>
      buildTargetExecutionPlan(config, {
        target: 'beta',
      })
    ).toThrow('is disabled');
  });

  it('throws when both target and all-targets mode are requested', () => {
    const config = ConfigSchema.parse({
      configVersion: 1,
      outputDir: './docs/api',
      framework: 'docusaurus',
      targets: [{ name: 'prod', outputDir: './docs/api' }],
    });

    expect(() =>
      buildTargetExecutionPlan(config, {
        target: 'prod',
        allTargets: true,
      })
    ).toThrow('Cannot combine target selection with all-targets mode');
  });

  it('merges target overrides onto root config', () => {
    const config = ConfigSchema.parse({
      configVersion: 1,
      schema: './graphql/api.graphql',
      outputDir: './docs/api',
      framework: 'docusaurus',
      metadataDir: './docs-metadata',
      llmDocs: {
        enabled: true,
        outputDir: './static/llm-docs',
        strategy: 'chunked',
        includeExamples: true,
        maxTypeDepth: 3,
      },
      adapters: {
        docusaurus: {
          docsRoot: './docs',
          sidebarTarget: 'apiSidebar',
        },
      },
      targets: [
        {
          name: 'lab',
          schema: {
            primary: './graphql/api-lab.graphql',
            fallback: './graphql/api.graphql',
          },
          outputDir: './versioned_docs/version-lab/api',
          llmDocs: {
            enabled: false,
          },
          adapters: {
            docusaurus: {
              docIdPrefix: 'api',
              sidebarFile: './versioned_sidebars/version-lab-sidebars.json',
            },
          },
        },
      ],
    });

    const [plan] = buildTargetExecutionPlan(config, { target: 'lab' });

    expect(plan.config.schema).toEqual({
      primary: './graphql/api-lab.graphql',
      fallback: './graphql/api.graphql',
    });
    expect(plan.config.outputDir).toBe('./versioned_docs/version-lab/api');
    expect(plan.config.llmDocs.enabled).toBe(false);
    expect(plan.config.llmDocs.outputDir).toBe('./static/llm-docs');
    expect(plan.config.adapters.docusaurus.docIdPrefix).toBe('api');
    expect(plan.config.adapters.docusaurus.sidebarFile).toBe(
      './versioned_sidebars/version-lab-sidebars.json'
    );
    expect(plan.config.adapters.docusaurus.sidebarTarget).toBe('apiSidebar');
  });

  it('reports configured targets', () => {
    const config = ConfigSchema.parse({
      configVersion: 1,
      outputDir: './docs/api',
      framework: 'docusaurus',
      targets: [{ name: 'prod', outputDir: './docs/api' }],
    });

    expect(hasConfiguredTargets(config)).toBe(true);
    expect(
      hasConfiguredTargets(
        ConfigSchema.parse({
          configVersion: 1,
          outputDir: './docs/api',
          framework: 'docusaurus',
        })
      )
    ).toBe(false);
  });
});
