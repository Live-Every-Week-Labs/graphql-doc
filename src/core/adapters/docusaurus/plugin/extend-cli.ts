import { loadGeneratorConfig, resolveConfigPaths } from '../../../config/loader.js';
import { resolveSchemaPointer, resolveSchemaPointers } from '../../../config/schema-pointer.js';
import { SchemaLoader } from '../../../parser/schema-loader.js';
import type { NormalizedGraphqlDocDocusaurusPluginOptions } from './options.js';
import { runPluginGeneration } from './run-generation.js';

interface CliCommand {
  description(text: string): CliCommand;
  action(handler: () => void | Promise<void>): CliCommand;
}

interface CliInstance {
  command(name: string): CliCommand;
}

/**
 * Registers graphql-doc commands under the Docusaurus CLI process.
 *
 * This keeps plugin users inside the `docusaurus` command surface while
 * delegating all business logic to the same shared runtime used by plugin
 * lifecycle hooks.
 */
export function registerCliCommands(
  cli: CliInstance,
  siteDir: string,
  options: NormalizedGraphqlDocDocusaurusPluginOptions
): void {
  cli
    .command('graphql-doc:generate')
    .description('Run graphql-doc generation outside the build lifecycle')
    .action(async () => {
      const result = await runPluginGeneration({ siteDir, options });

      if (!options.quiet) {
        console.log(
          `[graphql-doc] Generated ${result.filesWritten} API docs, ${result.llmFilesWritten} LLM docs`
        );
      }
    });

  cli
    .command('graphql-doc:validate')
    .description('Validate graphql-doc configuration and schema')
    .action(async () => {
      let config = await loadGeneratorConfig(siteDir, options.configPath);
      config = resolveConfigPaths(config, siteDir);

      const schemaPointer = await resolveSchemaPointer({ schema: options.schema }, siteDir, {
        silent: !options.verbose,
        log: (message) => {
          if (options.quiet) {
            return;
          }
          console.log(`[graphql-doc] ${message}`);
        },
      });
      const resolvedSchemaPointer = resolveSchemaPointers(schemaPointer, siteDir);

      const schemaLoader = new SchemaLoader();
      await schemaLoader.load({
        schemaPointer: resolvedSchemaPointer,
        schemaExtensions: config.schemaExtensions,
        allowRemoteSchema: config.allowRemoteSchema,
      });

      if (!options.quiet) {
        console.log('[graphql-doc] Configuration and schema are valid.');
      }
    });
}
