import type { Config, TargetConfig } from './schema.js';

const DEFAULT_TARGET_NAME = 'default';

function normalizeTargetLookupKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
}

function mergeTargetConfig(baseConfig: Config, target: TargetConfig): Config {
  const mergedAgentSkillIntroDoc = {
    ...baseConfig.agentSkill.introDoc,
    ...(target.agentSkill?.introDoc ?? {}),
  };

  return {
    ...baseConfig,
    targets: undefined,
    schema: target.schema ?? baseConfig.schema,
    outputDir: target.outputDir ?? baseConfig.outputDir,
    cleanOutputDir: target.cleanOutputDir ?? baseConfig.cleanOutputDir,
    framework: target.framework ?? baseConfig.framework,
    metadataDir: target.metadataDir ?? baseConfig.metadataDir,
    examplesDir: target.examplesDir ?? baseConfig.examplesDir,
    exampleFiles: target.exampleFiles ?? baseConfig.exampleFiles,
    schemaExtensions: target.schemaExtensions ?? baseConfig.schemaExtensions,
    allowRemoteSchema: target.allowRemoteSchema ?? baseConfig.allowRemoteSchema,
    requireExamplesForDocumentedOperations:
      target.requireExamplesForDocumentedOperations ??
      baseConfig.requireExamplesForDocumentedOperations,
    excludeDocGroups: target.excludeDocGroups ?? baseConfig.excludeDocGroups,
    groupOrdering: target.groupOrdering ?? baseConfig.groupOrdering,
    typeExpansion: {
      ...baseConfig.typeExpansion,
      ...(target.typeExpansion ?? {}),
    },
    agentSkill: {
      ...baseConfig.agentSkill,
      ...(target.agentSkill ?? {}),
      introDoc: mergedAgentSkillIntroDoc,
    },
    adapters: {
      ...baseConfig.adapters,
      ...(target.adapters ?? {}),
      docusaurus: {
        ...baseConfig.adapters.docusaurus,
        ...(target.adapters?.docusaurus ?? {}),
      },
    },
    llmDocs: {
      ...baseConfig.llmDocs,
      ...(target.llmDocs ?? {}),
    },
  };
}

function getTargetMap(targets: TargetConfig[]): Map<string, TargetConfig> {
  const targetMap = new Map<string, TargetConfig>();

  for (const target of targets) {
    const lookupKey = normalizeTargetLookupKey(target.name);
    if (targetMap.has(lookupKey)) {
      throw new Error(
        `Ambiguous target selection aliases for "${target.name}". Target names must be unique when normalized.`
      );
    }

    targetMap.set(lookupKey, target);
  }

  return targetMap;
}

/**
 * Runtime options that select which configured targets to execute.
 */
export interface TargetPlanOptions {
  target?: string;
  allTargets?: boolean;
}

/**
 * Represents one concrete generation run derived from config + target overrides.
 */
export interface TargetExecutionPlan {
  isTargetedRun: boolean;
  targetName: string;
  config: Config;
}

/**
 * Build deterministic target execution plans from config.
 *
 * Behavior summary:
 * - no configured targets -> one legacy run using root config
 * - configured targets + no explicit selection -> all enabled targets
 * - configured targets + `target` -> exactly one enabled matching target
 * - configured targets + `allTargets` -> all enabled targets
 */
export function buildTargetExecutionPlan(
  baseConfig: Config,
  options: TargetPlanOptions = {}
): TargetExecutionPlan[] {
  if (options.target && options.allTargets) {
    throw new Error('Cannot combine target selection with all-targets mode.');
  }

  const configuredTargets = baseConfig.targets ?? [];
  if (configuredTargets.length === 0) {
    return [
      {
        isTargetedRun: false,
        targetName: DEFAULT_TARGET_NAME,
        config: {
          ...baseConfig,
          targets: undefined,
        },
      },
    ];
  }

  const targetMap = getTargetMap(configuredTargets);
  const enabledTargets = configuredTargets.filter((target) => target.enabled !== false);

  if (options.target) {
    const normalized = normalizeTargetLookupKey(options.target);
    const resolvedTarget = targetMap.get(normalized);

    if (!resolvedTarget) {
      const availableTargets = configuredTargets.map((target) => target.name).join(', ');
      throw new Error(
        `Unknown target "${options.target}". Available targets: ${availableTargets || 'none'}.`
      );
    }

    if (resolvedTarget.enabled === false) {
      throw new Error(
        `Target "${resolvedTarget.name}" is disabled. Set enabled: true to run it explicitly.`
      );
    }

    return [
      {
        isTargetedRun: true,
        targetName: resolvedTarget.name,
        config: mergeTargetConfig(baseConfig, resolvedTarget),
      },
    ];
  }

  const selectedTargets = options.allTargets ? enabledTargets : enabledTargets;

  if (selectedTargets.length === 0) {
    throw new Error('No enabled targets are configured.');
  }

  return selectedTargets.map((target) => ({
    isTargetedRun: true,
    targetName: target.name,
    config: mergeTargetConfig(baseConfig, target),
  }));
}

export function hasConfiguredTargets(config: Config): boolean {
  return (config.targets?.length ?? 0) > 0;
}
