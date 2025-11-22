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
  .action(async () => {
    try {
      // We'll import this dynamically or move the import to top if we want to be cleaner,
      // but for now let's use the imported loadGeneratorConfig
      const { loadGeneratorConfig } = await import('../core/config/loader.js');
      const config = await loadGeneratorConfig();

      console.log('Loaded configuration:', JSON.stringify(config, null, 2));
      console.log('Generating documentation... (Not implemented yet)');

      // Future: Call generator function here
    } catch (error) {
      console.error('Error generating documentation:', error);
      process.exit(1);
    }
  });

program.parse();
