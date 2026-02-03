import { input, confirm, select } from '@inquirer/prompts';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';

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

  const framework = await select({
    message: 'Documentation framework:',
    choices: [{ name: 'Docusaurus', value: 'docusaurus' }],
    default: DEFAULT_CONFIG.framework,
  });

  return {
    schemaPath,
    outputDir,
    metadataDir,
    framework,
  };
}

function generateGraphqlrcContent(config: InitConfig): string {
  return `schema: ${config.schemaPath}

extensions:
  graphql-docs:
    outputDir: ${config.outputDir}
    framework: ${config.framework}
    metadataDir: ${config.metadataDir}
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
      console.log(chalk.red('Cannot overwrite existing files in non-interactive mode.'));
      console.log(chalk.red('Use --force to overwrite existing files.\n'));
      process.exit(1);
    }

    const shouldOverwrite = await confirm({
      message: 'Do you want to overwrite these files?',
      default: false,
    });

    if (!shouldOverwrite) {
      console.log(chalk.yellow('\nInitialization cancelled.\n'));
      process.exit(0);
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

    spinner.succeed('Project files created successfully!');

    // Show success message
    console.log(chalk.green('\n  Initialized graphql-docs project!\n'));

    console.log(chalk.white('  Created:'));
    createdFiles.forEach((file) => {
      console.log(chalk.dim(`    - ${file}`));
    });

    console.log(chalk.white('\n  Next steps:'));
    console.log(chalk.dim(`    1. Place your GraphQL schema at: ${config.schemaPath}`));
    console.log(chalk.dim(`    2. Customize the example files in ${config.metadataDir}/`));
    console.log(chalk.dim('    3. Run: graphql-docs generate\n'));
  } catch (error) {
    spinner.fail('Failed to create project files');
    console.error(chalk.red(`\nError: ${(error as Error).message}\n`));
    process.exit(1);
  }
}
