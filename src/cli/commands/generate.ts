import fs from 'node:fs';
import path from 'path';
import chalk from 'chalk';
import { loadGeneratorConfig, resolveConfigPaths } from '../../core/config/loader.js';
import { buildTargetExecutionPlan } from '../../core/config/targets.js';
import { Generator } from '../../core/generator.js';
import { getExamplePatterns } from '../../core/metadata/example-sources.js';
import { getErrorMessage } from '../../core/utils/index.js';
import { resolveSchemaPointerCandidates } from '../schema-resolver.js';
import { createSpinner, spinnerSucceed, spinnerFail } from '../utils.js';
import type { Logger } from '../../core/logger.js';
import type { Config } from '../../core/config/schema.js';

export interface GenerateOptions {
  schema?: string | string[];
  output?: string;
  config?: string;
  cleanOutput?: boolean;
  target?: string;
  allTargets?: boolean;
  targetDir?: string; // For testing - defaults to process.cwd()
  llmDocs?: boolean;
  llmDocsStrategy?: 'single' | 'chunked';
  llmDocsDepth?: string;
  llmExamples?: boolean;
  dryRun?: boolean;
  verbose?: boolean;
  quiet?: boolean;
  watch?: boolean;
}

interface GenerateExecutionContext {
  watchSources: string[];
}

function createUserLogger(options: { quiet: boolean; verbose: boolean }) {
  return {
    info(message: string) {
      if (!options.quiet && options.verbose) {
        console.log(chalk.dim(message));
      }
    },
    warn(message: string) {
      if (!options.quiet) {
        console.warn(chalk.yellow(`Warning: ${message}`));
      }
    },
  };
}

function formatCliError(error: unknown): string {
  const message = getErrorMessage(error);
  return /^\s*Failed to/i.test(message) ? message : `Error: ${message}`;
}

function wrapGenerateFailure(error: unknown): Error {
  const message = getErrorMessage(error);
  if (/^\s*Failed to/i.test(message)) {
    return new Error(message);
  }
  return new Error(`Failed to generate documentation: ${message}`);
}

function toArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value];
}

function normalizeWatchPath(input: string, targetDir: string): string | null {
  if (!input || /^https?:\/\//i.test(input)) {
    return null;
  }

  const absolute = path.isAbsolute(input) ? input : path.resolve(targetDir, input);
  const wildcardIndex = absolute.search(/[*?[{]/);
  const withoutGlob = wildcardIndex >= 0 ? absolute.slice(0, wildcardIndex) : absolute;
  const candidate = wildcardIndex >= 0 ? path.dirname(withoutGlob) : withoutGlob;

  let watchPath = candidate;
  while (!fs.existsSync(watchPath)) {
    const parent = path.dirname(watchPath);
    if (parent === watchPath) {
      return null;
    }
    watchPath = parent;
  }

  return watchPath;
}

function buildWatchTargets(context: GenerateExecutionContext, options: GenerateOptions): string[] {
  const sources = [...context.watchSources];

  if (options.config) {
    sources.push(options.config);
  }

  return Array.from(
    new Set(
      sources
        .map((entry) => normalizeWatchPath(entry, options.targetDir ?? process.cwd()))
        .filter((entry): entry is string => Boolean(entry))
    )
  );
}

function printDryRunPreview(
  config: Config,
  result: Awaited<ReturnType<Generator['generate']>>,
  options: { quiet: boolean; verbose: boolean }
): void {
  if (options.quiet) {
    return;
  }

  const docTargets = result.generatedFiles.map((file) => path.resolve(config.outputDir, file.path));
  const llmTargets =
    config.llmDocs?.enabled && config.llmDocs.outputDir
      ? result.llmFiles.map((file) => path.resolve(config.llmDocs.outputDir, file.path))
      : [];

  const previewTargets = [...docTargets, ...llmTargets];
  const sampleSize = options.verbose ? previewTargets.length : Math.min(previewTargets.length, 12);

  console.log(chalk.yellow('\nDry run mode: no files were written.\n'));
  console.log(chalk.white(`Planned docs files: ${docTargets.length}`));
  console.log(chalk.white(`Planned LLM docs files: ${llmTargets.length}`));

  if (previewTargets.length > 0) {
    console.log(chalk.white('\nPlanned outputs:'));
    for (const target of previewTargets.slice(0, sampleSize)) {
      console.log(chalk.dim(`  - ${target}`));
    }
    if (sampleSize < previewTargets.length) {
      console.log(chalk.dim(`  ...and ${previewTargets.length - sampleSize} more`));
    }
  }

  console.log();
}

function applyRuntimeOptionOverrides(config: Config, options: GenerateOptions): Config {
  const updated: Config = {
    ...config,
    llmDocs: {
      ...config.llmDocs,
    },
  };

  if (options.output) {
    updated.outputDir = options.output;
  }

  if (options.cleanOutput !== undefined) {
    updated.cleanOutputDir = options.cleanOutput;
  }

  if (options.llmDocs !== undefined) {
    updated.llmDocs.enabled = options.llmDocs;
  }

  if (options.llmDocsStrategy) {
    if (options.llmDocsStrategy !== 'single' && options.llmDocsStrategy !== 'chunked') {
      throw new Error('llm-docs-strategy must be "single" or "chunked"');
    }
    updated.llmDocs.strategy = options.llmDocsStrategy;
  }

  if (options.llmDocsDepth) {
    const depth = Number(options.llmDocsDepth);
    if (Number.isNaN(depth) || depth < 1 || depth > 5) {
      throw new Error('llm-docs-depth must be a number between 1 and 5');
    }
    updated.llmDocs.maxTypeDepth = depth as 1 | 2 | 3 | 4 | 5;
  }

  if (options.llmExamples === false) {
    updated.llmDocs.includeExamples = false;
  }

  return updated;
}

function collectWatchSources(
  config: Config,
  primarySchemaPointer: string | string[],
  fallbackSchemaPointer?: string | string[]
): string[] {
  const sources = [
    ...getExamplePatterns(config),
    ...(config.schemaExtensions ?? []),
    ...toArray(primarySchemaPointer),
  ];

  if (fallbackSchemaPointer) {
    sources.push(...toArray(fallbackSchemaPointer));
  }

  return sources;
}

function formatSchemaPointer(schemaPointer: string | string[]): string {
  return Array.isArray(schemaPointer) ? schemaPointer.join(', ') : schemaPointer;
}

async function executeGenerateOnce(
  options: GenerateOptions,
  output: ReturnType<typeof createUserLogger>
): Promise<GenerateExecutionContext> {
  const targetDir = options.targetDir ?? process.cwd();
  const quiet = options.quiet === true;
  const verbose = options.verbose === true;
  const dryRun = options.dryRun === true;

  const configSpinner = createSpinner('Loading configuration...', quiet);
  let config: Config;
  try {
    config = await loadGeneratorConfig(targetDir, options.config);
    spinnerSucceed(configSpinner, 'Configuration loaded', quiet);
  } catch (error) {
    spinnerFail(configSpinner, 'Failed to load configuration', quiet);
    throw new Error(`Failed to load configuration: ${getErrorMessage(error)}`);
  }

  const runtimeConfig = resolveConfigPaths(applyRuntimeOptionOverrides(config, options), targetDir);
  const targetPlans = buildTargetExecutionPlan(runtimeConfig, {
    target: options.target,
    allTargets: options.allTargets,
  });

  const watchSources: string[] = [];

  for (const targetPlan of targetPlans) {
    const planConfig = resolveConfigPaths(targetPlan.config, targetDir);
    const schemaSource = options.schema ?? planConfig.schema;
    const schemaCandidates = await resolveSchemaPointerCandidates(
      {
        schema: schemaSource,
      },
      targetDir,
      {
        silent: quiet,
        log: verbose ? (message) => console.log(chalk.dim(message)) : undefined,
      }
    );

    if (verbose && !quiet) {
      console.log(
        chalk.dim(
          `Resolved primary schema pointer${targetPlan.isTargetedRun ? ` for ${targetPlan.targetName}` : ''}: ${formatSchemaPointer(
            schemaCandidates.primary
          )}`
        )
      );
      if (schemaCandidates.fallback) {
        console.log(
          chalk.dim(
            `Resolved fallback schema pointer${targetPlan.isTargetedRun ? ` for ${targetPlan.targetName}` : ''}: ${formatSchemaPointer(
              schemaCandidates.fallback
            )}`
          )
        );
      }
    }

    const targetLabel = targetPlan.isTargetedRun
      ? `target "${targetPlan.targetName}"`
      : 'default run';
    const generateSpinner = createSpinner(`Generating documentation for ${targetLabel}...`, quiet);
    const generationWarnings: string[] = [];
    const generatorLogger: Logger = {
      info: (message) => {
        if (generateSpinner) {
          generateSpinner.text = message;
        }
        if (verbose && !quiet) {
          console.log(chalk.dim(message));
        }
      },
      warn: (message) => {
        generationWarnings.push(message);
      },
    };

    let result: Awaited<ReturnType<Generator['generate']>>;
    let resolvedSchemaPath = schemaCandidates.primary;

    try {
      const generator = new Generator(planConfig, generatorLogger);
      result = await generator.generate(schemaCandidates.primary, { dryRun });
    } catch (primaryError) {
      if (!schemaCandidates.fallback) {
        spinnerFail(generateSpinner, `Failed to generate documentation for ${targetLabel}`, quiet);
        throw wrapGenerateFailure(primaryError);
      }

      output.warn(
        `Primary schema failed for ${targetLabel}. Retrying with fallback schema pointer.`
      );
      if (verbose && !quiet) {
        console.log(chalk.dim(`Primary schema error: ${getErrorMessage(primaryError)}`));
      }

      try {
        const generator = new Generator(planConfig, generatorLogger);
        result = await generator.generate(schemaCandidates.fallback, { dryRun });
        resolvedSchemaPath = schemaCandidates.fallback;
      } catch (fallbackError) {
        spinnerFail(generateSpinner, `Failed to generate documentation for ${targetLabel}`, quiet);
        throw wrapGenerateFailure(
          new Error(
            `Primary schema failed (${getErrorMessage(
              primaryError
            )}) and fallback schema failed (${getErrorMessage(fallbackError)}).`
          )
        );
      }
    }

    spinnerSucceed(generateSpinner, `Documentation generated for ${targetLabel}!`, quiet);

    for (const warning of generationWarnings) {
      output.warn(warning);
    }

    if (dryRun) {
      printDryRunPreview(planConfig, result, { quiet, verbose });
    } else if (!quiet) {
      console.log(chalk.green(`\nOutput (${targetLabel}): ${planConfig.outputDir}\n`));
    }

    watchSources.push(
      ...collectWatchSources(planConfig, schemaCandidates.primary, schemaCandidates.fallback),
      ...toArray(resolvedSchemaPath)
    );
  }

  return { watchSources };
}

/**
 * Run the generate command
 */
export async function runGenerate(options: GenerateOptions): Promise<void> {
  if (options.verbose && options.quiet) {
    throw new Error('--verbose and --quiet cannot be used together');
  }

  const quiet = options.quiet === true;
  const verbose = options.verbose === true;
  const output = createUserLogger({ quiet, verbose });

  if (!quiet) {
    console.log(chalk.blue('\nGraphQL Docs Generator\n'));
  }

  const firstRunContext = await executeGenerateOnce(options, output);

  if (!options.watch) {
    return;
  }

  const watchTargets = buildWatchTargets(firstRunContext, options);
  if (watchTargets.length === 0) {
    throw new Error('Watch mode enabled, but no local file paths were available to watch.');
  }

  if (!quiet) {
    console.log(chalk.blue(`Watching for changes in ${watchTargets.length} path(s)...`));
  }

  let debounceTimer: NodeJS.Timeout | null = null;
  let generationInFlight = false;
  let regenerateQueued = false;

  const runRegeneration = async (reason: string) => {
    if (generationInFlight) {
      regenerateQueued = true;
      return;
    }

    generationInFlight = true;
    do {
      regenerateQueued = false;
      if (!quiet) {
        console.log(chalk.dim(`\n${reason}`));
      }
      try {
        await executeGenerateOnce(options, output);
      } catch (error) {
        console.error(chalk.red(formatCliError(error)));
      }
    } while (regenerateQueued);

    generationInFlight = false;
  };

  const scheduleRegeneration = (reason: string) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(() => {
      void runRegeneration(reason);
    }, 250);
  };

  const watchers = watchTargets.map((watchPath) =>
    fs.watch(watchPath, () => {
      scheduleRegeneration(`Detected change in ${watchPath}`);
    })
  );

  await new Promise<void>((resolve) => {
    const shutdown = () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      for (const watcher of watchers) {
        watcher.close();
      }
      process.off('SIGINT', shutdown);
      process.off('SIGTERM', shutdown);
      if (!quiet) {
        console.log(chalk.blue('\nStopped watch mode.\n'));
      }
      resolve();
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  });
}
