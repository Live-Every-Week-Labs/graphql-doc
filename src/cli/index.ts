#!/usr/bin/env node
import { Command } from 'commander';
import { version } from '../index.js';

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
  .option('--llm-docs', 'Enable LLM docs generation')
  .option('--llm-docs-strategy <strategy>', 'LLM docs strategy: single or chunked')
  .option('--llm-docs-depth <depth>', 'Max type expansion depth for LLM docs (1-5)')
  .option('--no-llm-examples', 'Exclude examples from LLM docs')
  .action(async (options) => {
    try {
      const { runGenerate } = await import('./commands/generate.js');
      await runGenerate(options);
    } catch (error) {
      console.error('Error generating documentation:', error);
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
      console.error('Error initializing project:', error);
      process.exit(1);
    }
  });

program
  .command('validate')
  .description('Validate GraphQL schema and metadata files')
  .option('-s, --schema <path>', 'Path to GraphQL schema')
  .option('-c, --config <path>', 'Path to config file')
  .option('--strict', 'Treat warnings as errors')
  .action(async (options) => {
    try {
      const { runValidate } = await import('./commands/validate.js');
      await runValidate(options);
    } catch (error) {
      console.error('Error validating:', error);
      process.exit(1);
    }
  });

program.parse();
