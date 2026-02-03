import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { loadConfig } from 'graphql-config';
import { loadGeneratorConfig } from '../../core/config/loader.js';
import { Generator } from '../../core/generator.js';

export interface GenerateOptions {
  schema?: string;
  output?: string;
  config?: string;
  targetDir?: string; // For testing - defaults to process.cwd()
}

/**
 * Resolve schema pointer from options or graphql-config
 */
async function resolveSchemaPointer(
  options: GenerateOptions,
  targetDir: string
): Promise<string | string[]> {
  // 1. CLI option takes priority
  if (options.schema) {
    return options.schema;
  }

  // 2. Try to get from graphql-config (.graphqlrc)
  try {
    const gqlConfig = await loadConfig({ rootDir: targetDir });
    if (gqlConfig) {
      const project = gqlConfig.getDefault();
      const schemaFromConfig = project.schema;

      if (typeof schemaFromConfig === 'string') {
        console.log(chalk.dim(`Using schema from .graphqlrc: ${schemaFromConfig}`));
        return schemaFromConfig;
      }

      if (Array.isArray(schemaFromConfig)) {
        const stringSchemas = schemaFromConfig.filter(
          (pointer): pointer is string => typeof pointer === 'string'
        );
        if (stringSchemas.length > 0) {
          console.log(chalk.dim(`Using schema from .graphqlrc: ${stringSchemas.join(', ')}`));
          return stringSchemas;
        }
      }
    }
  } catch {
    // graphql-config not found or failed to load, continue to default
  }

  // 3. Fall back to default
  console.log(chalk.dim(`No schema provided, using default: schema.graphql`));
  return 'schema.graphql';
}

/**
 * Run the generate command
 */
export async function runGenerate(options: GenerateOptions): Promise<void> {
  const targetDir = options.targetDir ?? process.cwd();

  console.log(chalk.blue('\nGraphQL Docs Generator\n'));

  // Load configuration
  const configSpinner = ora('Loading configuration...').start();
  let config;
  try {
    config = await loadGeneratorConfig(targetDir, options.config);
    configSpinner.succeed('Configuration loaded');
  } catch (error) {
    configSpinner.fail('Failed to load configuration');
    console.error(chalk.red(`Error: ${(error as Error).message}`));
    process.exit(1);
  }

  // Override config with CLI options
  if (options.output) {
    config.outputDir = options.output;
  }

  // Resolve paths relative to targetDir
  if (!path.isAbsolute(config.outputDir)) {
    config.outputDir = path.resolve(targetDir, config.outputDir);
  }
  if (config.examplesDir && !path.isAbsolute(config.examplesDir)) {
    config.examplesDir = path.resolve(targetDir, config.examplesDir);
  }
  if (!path.isAbsolute(config.metadataDir)) {
    config.metadataDir = path.resolve(targetDir, config.metadataDir);
  }
  if (config.schemaExtensions && config.schemaExtensions.length > 0) {
    config.schemaExtensions = config.schemaExtensions.map((extension) =>
      path.isAbsolute(extension) ? extension : path.resolve(targetDir, extension)
    );
  }
  if (config.introDocs && config.introDocs.length > 0) {
    config.introDocs = config.introDocs.map((doc) => {
      if (typeof doc === 'string') {
        return path.isAbsolute(doc) ? doc : path.resolve(targetDir, doc);
      }
      const source = path.isAbsolute(doc.source) ? doc.source : path.resolve(targetDir, doc.source);
      return { ...doc, source };
    });
  }

  // Resolve schema pointer
  const schemaPointer = await resolveSchemaPointer(options, targetDir);
  const resolvePointer = (pointer: string) => {
    const isRemoteSchema = /^https?:\/\//i.test(pointer);
    return isRemoteSchema || path.isAbsolute(pointer) ? pointer : path.resolve(targetDir, pointer);
  };
  const resolvedSchemaPath = Array.isArray(schemaPointer)
    ? schemaPointer.map(resolvePointer)
    : resolvePointer(schemaPointer);

  // Generate documentation
  const generateSpinner = ora('Generating documentation...').start();
  try {
    const generator = new Generator(config);
    await generator.generate(resolvedSchemaPath);
    generateSpinner.succeed('Documentation generated successfully!');

    console.log(chalk.green(`\nOutput: ${config.outputDir}\n`));
  } catch (error) {
    generateSpinner.fail('Failed to generate documentation');
    console.error(chalk.red(`Error: ${(error as Error).message}`));
    process.exit(1);
  }
}
