#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { version } from '../index.js';
import { getErrorMessage } from '../core/utils/index.js';

const program = new Command();

program
  .name('graphql-docs')
  .description('GraphQL Operation-First Documentation Generator')
  .version(version);

program
  .command('generate')
  .description('Generate documentation from GraphQL schema')
  .option('-s, --schema <path>', 'Path to GraphQL schema')
  .option('-o, --output <path>', 'Output directory')
  .option('-c, --config <path>', 'Path to config file')
  .option('--clean-output', 'Remove existing files in output directory before generating')
  .option('--dry-run', 'Preview generated files without writing them to disk')
  .option('--watch', 'Watch schema/example/config files and regenerate on change')
  .option('--verbose', 'Enable verbose logging')
  .option('--quiet', 'Suppress non-error output')
  .option('--llm-docs', 'Enable LLM docs generation')
  .option('--llm-docs-strategy <strategy>', 'LLM docs strategy: single or chunked')
  .option('--llm-docs-depth <depth>', 'Max type expansion depth for LLM docs (1-5)')
  .option('--no-llm-examples', 'Exclude examples from LLM docs')
  .action(async (options) => {
    try {
      const { runGenerate } = await import('./commands/generate.js');
      await runGenerate(options);
    } catch (error) {
      console.error(chalk.red(`Error: ${getErrorMessage(error)}`));
      process.exit(1);
    }
  });

program
  .command('init')
  .description('Initialize a new graphql-docs project')
  .option('-f, --force', 'Overwrite existing files')
  .option('-y, --yes', 'Skip prompts and use defaults')
  .action(async (options) => {
    try {
      const { runInit } = await import('./commands/init.js');
      await runInit(options);
    } catch (error) {
      console.error(chalk.red(`Error: ${getErrorMessage(error)}`));
      process.exit(1);
    }
  });

program
  .command('validate')
  .description('Validate GraphQL schema and metadata files')
  .option('-s, --schema <path>', 'Path to GraphQL schema')
  .option('-c, --config <path>', 'Path to config file')
  .option('--strict', 'Treat warnings as errors')
  .option('--json', 'Emit machine-readable JSON output')
  .option('--verbose', 'Enable verbose logging')
  .option('--quiet', 'Suppress non-error output')
  .action(async (options) => {
    try {
      const { runValidate } = await import('./commands/validate.js');
      await runValidate(options);
    } catch (error) {
      if (!options.json) {
        console.error(chalk.red(`Error: ${getErrorMessage(error)}`));
      }
      process.exit(1);
    }
  });

program.parse();
