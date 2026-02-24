import { input, confirm } from '@inquirer/prompts';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { DIRECTIVE_DEFINITIONS } from '../../core/parser/directive-definitions.js';
import { getErrorMessage } from '../../core/utils/index.js';
import { escapeYamlValue } from '../../core/utils/yaml-escape.js';

export interface InitOptions {
  force?: boolean;
  yes?: boolean;
  targetDir?: string; // For testing - defaults to process.cwd()
}

interface InitConfig {
  schemaPath: string;
  outputDir: string;
  metadataDir: string;
  framework: string;
}

const DEFAULT_CONFIG: InitConfig = {
  schemaPath: 'schema.graphql',
  outputDir: './docs/api',
  metadataDir: './docs-metadata',
  framework: 'docusaurus',
};

const SAMPLE_QUERY_EXAMPLE = {
  operation: 'exampleQuery',
  operationType: 'query',
  examples: [
    {
      name: 'Basic Example',
      description: 'A basic example of this query',
      query: 'query ExampleQuery($id: ID!) {\n  exampleQuery(id: $id) {\n    id\n    name\n  }\n}',
      variables: {
        id: '123',
      },
      response: {
        type: 'success',
        httpStatus: 200,
        body: {
          data: {
            exampleQuery: {
              id: '123',
              name: 'Example Item',
            },
          },
        },
      },
    },
  ],
};

const SAMPLE_MUTATION_EXAMPLE = {
  operation: 'exampleMutation',
  operationType: 'mutation',
  examples: [
    {
      name: 'Create Example',
      description: 'A basic example of this mutation',
      query:
        'mutation ExampleMutation($input: ExampleInput!) {\n  exampleMutation(input: $input) {\n    id\n    name\n  }\n}',
      variables: {
        input: {
          name: 'New Item',
        },
      },
      response: {
        type: 'success',
        httpStatus: 200,
        body: {
          data: {
            exampleMutation: {
              id: '456',
              name: 'New Item',
            },
          },
        },
      },
    },
  ],
};

async function promptForConfig(): Promise<InitConfig> {
  const schemaPath = await input({
    message: 'Path to your GraphQL schema:',
    default: DEFAULT_CONFIG.schemaPath,
  });

  const outputDir = await input({
    message: 'Output directory for generated docs:',
    default: DEFAULT_CONFIG.outputDir,
  });

  const metadataDir = await input({
    message: 'Directory for examples metadata:',
    default: DEFAULT_CONFIG.metadataDir,
  });

  console.log(chalk.dim('Using Docusaurus framework (the only currently supported framework).'));

  return {
    schemaPath,
    outputDir,
    metadataDir,
    framework: 'docusaurus',
  };
}

function generateGraphqlrcContent(config: InitConfig): string {
  const schemaPath = escapeYamlValue(config.schemaPath);
  const outputDir = escapeYamlValue(config.outputDir);
  const framework = escapeYamlValue(config.framework);
  const metadataDir = escapeYamlValue(config.metadataDir);

  return `schema: ${schemaPath}

extensions:
  graphql-doc:
    outputDir: ${outputDir}
    framework: ${framework}
    metadataDir: ${metadataDir}
    adapters:
      docusaurus: {}
`;
}

async function checkExistingFiles(targetDir: string): Promise<string[]> {
  const existingFiles: string[] = [];

  const graphqlrcPath = path.join(targetDir, '.graphqlrc');
  if (await fs.pathExists(graphqlrcPath)) {
    existingFiles.push('.graphqlrc');
  }

  const metadataPath = path.join(targetDir, 'docs-metadata');
  if (await fs.pathExists(metadataPath)) {
    existingFiles.push('docs-metadata/');
  }

  const directivesPath = path.join(targetDir, 'graphql-doc-directives.graphql');
  if (await fs.pathExists(directivesPath)) {
    existingFiles.push('graphql-doc-directives.graphql');
  }

  return existingFiles;
}

export async function runInit(options: InitOptions): Promise<void> {
  const targetDir = options.targetDir ?? process.cwd();

  console.log(chalk.blue('\nGraphQL Docs Initializer\n'));

  // Check for existing files
  const existingFiles = await checkExistingFiles(targetDir);

  if (existingFiles.length > 0 && !options.force) {
    console.log(chalk.yellow('The following files/directories already exist:'));
    existingFiles.forEach((file) => console.log(chalk.yellow(`  - ${file}`)));
    console.log();

    if (options.yes) {
      throw new Error(
        'Cannot overwrite existing files in non-interactive mode. Use --force to overwrite existing files.'
      );
    }

    const shouldOverwrite = await confirm({
      message: 'Do you want to overwrite these files?',
      default: false,
    });

    if (!shouldOverwrite) {
      console.log(chalk.yellow('\nInitialization cancelled.\n'));
      return;
    }
  }

  // Get configuration
  let config: InitConfig;

  if (options.yes) {
    config = DEFAULT_CONFIG;
    console.log(chalk.dim('Using default configuration...'));
  } else {
    config = await promptForConfig();
  }

  // Create files
  const spinner = ora('Creating project files...').start();

  try {
    const createdFiles: string[] = [];

    // Create .graphqlrc
    const graphqlrcPath = path.join(targetDir, '.graphqlrc');
    await fs.writeFile(graphqlrcPath, generateGraphqlrcContent(config));
    createdFiles.push('.graphqlrc');

    // Create metadata directories
    const metadataDir = path.join(targetDir, config.metadataDir);
    const queriesDir = path.join(metadataDir, 'examples', 'queries');
    const mutationsDir = path.join(metadataDir, 'examples', 'mutations');
    await fs.ensureDir(queriesDir);
    await fs.ensureDir(mutationsDir);

    // Create sample files
    const queryExamplePath = path.join(queriesDir, 'example-query.json');
    await fs.writeJson(queryExamplePath, SAMPLE_QUERY_EXAMPLE, { spaces: 2 });
    createdFiles.push(path.relative(targetDir, queryExamplePath));

    const mutationExamplePath = path.join(mutationsDir, 'example-mutation.json');
    await fs.writeJson(mutationExamplePath, SAMPLE_MUTATION_EXAMPLE, { spaces: 2 });
    createdFiles.push(path.relative(targetDir, mutationExamplePath));

    // Create directives file
    const directivesPath = path.join(targetDir, 'graphql-doc-directives.graphql');
    const directivesContent = `# GraphQL Documentation Generator Directives
#
# These directives are used by @graphql-doc/generator to organize and control
# documentation generation. They have no runtime behavior and are safe to include
# in your production schema.
#
# Include this file in your schema before deploying to AppSync or other GraphQL servers.
# For example, in your .graphqlrc:
#   schema:
#     - ./schema.graphql
#     - ./graphql-doc-directives.graphql

${DIRECTIVE_DEFINITIONS}
`;
    await fs.writeFile(directivesPath, directivesContent);
    createdFiles.push('graphql-doc-directives.graphql');

    spinner.succeed('Project files created successfully!');

    // Show success message
    console.log(chalk.green('\n  Initialized graphql-doc project!\n'));

    console.log(chalk.white('  Created:'));
    createdFiles.forEach((file) => {
      console.log(chalk.dim(`    - ${file}`));
    });

    console.log(chalk.white('\n  Next steps:'));
    console.log(chalk.dim(`    1. Place your GraphQL schema at: ${config.schemaPath}`));
    console.log(
      chalk.dim(
        `    2. Import graphql-doc-directives.graphql in your schema (required for AppSync/production)`
      )
    );
    console.log(chalk.dim(`    3. Customize the example files in ${config.metadataDir}/`));
    console.log(chalk.dim('    4. Run: graphql-doc generate\n'));
  } catch (error) {
    spinner.fail('Failed to create project files');
    throw new Error(`Failed to create project files: ${getErrorMessage(error)}`);
  }
}
