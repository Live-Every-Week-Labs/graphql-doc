import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { loadGeneratorConfig } from '../../core/config/loader.js';
import {
  SchemaValidator,
  MetadataValidator,
  ValidationError,
  ValidationResult,
} from '../../core/validation/index.js';

export interface ValidateOptions {
  schema?: string;
  config?: string;
  strict?: boolean;
  targetDir?: string; // For testing - defaults to process.cwd()
}

/**
 * Format a validation error for display
 */
function formatError(error: ValidationError): string {
  let location = '';
  if (error.line !== undefined) {
    location =
      error.column !== undefined
        ? ` (line ${error.line}, col ${error.column})`
        : ` (line ${error.line})`;
  }
  return `${error.file}${location}: ${error.message}`;
}

/**
 * Print validation errors/warnings grouped by file
 */
function printErrors(errors: ValidationError[], type: 'error' | 'warning'): void {
  const icon = type === 'error' ? chalk.red('  ✗') : chalk.yellow('  ⚠');
  const colorFn = type === 'error' ? chalk.red : chalk.yellow;

  // Group by file
  const byFile = new Map<string, ValidationError[]>();
  for (const error of errors) {
    const existing = byFile.get(error.file) || [];
    existing.push(error);
    byFile.set(error.file, existing);
  }

  for (const [file, fileErrors] of byFile) {
    console.log(`${icon} ${file}`);
    for (const error of fileErrors) {
      let location = '';
      if (error.line !== undefined) {
        location =
          error.column !== undefined
            ? `Line ${error.line}, Col ${error.column}: `
            : `Line ${error.line}: `;
      }
      console.log(colorFn(`    ${location}${error.message}`));
    }
  }
}

/**
 * Run the validate command
 */
export async function runValidate(options: ValidateOptions): Promise<void> {
  const targetDir = options.targetDir ?? process.cwd();

  console.log(chalk.blue('\nGraphQL Docs Validator\n'));

  // Load configuration
  let config;
  try {
    config = await loadGeneratorConfig(targetDir, options.config);
  } catch (error) {
    console.error(chalk.red(`Failed to load config: ${(error as Error).message}`));
    process.exit(1);
  }

  // Determine schema path
  const schemaPath = options.schema ?? 'schema.graphql';
  const resolvedSchemaPath = path.isAbsolute(schemaPath)
    ? schemaPath
    : path.resolve(targetDir, schemaPath);

  // Initialize validators
  const schemaValidator = new SchemaValidator();
  const metadataValidator = new MetadataValidator();

  // Collect all results
  const allErrors: ValidationError[] = [];
  const allWarnings: ValidationError[] = [];
  let schemaValid = false;
  let examplesValid = false;
  let errorsValid = false;
  let operationNames: string[] = [];

  // ===== Schema Validation =====
  const schemaSpinner = ora('Validating schema...').start();

  const schemaResult = await schemaValidator.validate(resolvedSchemaPath);
  operationNames = schemaResult.operationNames;

  if (schemaResult.errors.length > 0) {
    schemaSpinner.fail('Schema validation failed');
    allErrors.push(...schemaResult.errors);
  } else {
    schemaSpinner.succeed(`Schema syntax valid (${operationNames.length} operations found)`);
    schemaValid = true;
  }
  allWarnings.push(...schemaResult.warnings);

  // ===== Examples Validation =====
  const examplesDir = config.examplesDir ?? path.join(config.metadataDir, 'examples');
  const examplesPattern = path.join(targetDir, examplesDir, '**/*.json');

  const examplesSpinner = ora('Validating example files...').start();

  const examplesResult = await metadataValidator.validateExamples(examplesPattern);

  if (examplesResult.errors.length > 0) {
    examplesSpinner.fail('Example files validation failed');
    allErrors.push(...examplesResult.errors);
  } else {
    const fileCount = examplesResult.referencedOperations.length;
    examplesSpinner.succeed(`Example files valid (${fileCount} operations documented)`);
    examplesValid = true;
  }
  allWarnings.push(...examplesResult.warnings);

  // ===== Error Files Validation =====
  const errorsDir = config.errorsDir ?? path.join(config.metadataDir, 'errors');
  const errorsPattern = path.join(targetDir, errorsDir, '**/*.json');

  const errorsSpinner = ora('Validating error files...').start();

  const errorFilesResult = await metadataValidator.validateErrors(errorsPattern);

  if (errorFilesResult.errors.length > 0) {
    errorsSpinner.fail('Error files validation failed');
    allErrors.push(...errorFilesResult.errors);
  } else {
    errorsSpinner.succeed('Error files valid');
    errorsValid = true;
  }
  allWarnings.push(...errorFilesResult.warnings);

  // ===== Cross-validation =====
  if (schemaValid) {
    const crossValidationSpinner = ora('Cross-validating operations...').start();

    // Build map of referenced operations to files
    const referencedOps = new Map<string, string[]>();

    // From examples - each example file references one operation
    for (const op of examplesResult.referencedOperations) {
      const existing = referencedOps.get(op) || [];
      existing.push(`${examplesDir}/**/*.json`);
      referencedOps.set(op, existing);
    }

    // From error files - each error file can reference multiple operations
    for (const op of errorFilesResult.referencedOperations) {
      const existing = referencedOps.get(op) || [];
      existing.push(`${errorsDir}/**/*.json`);
      referencedOps.set(op, existing);
    }

    const schemaOps = new Set(operationNames);
    const crossValidationWarnings = metadataValidator.crossValidateOperations(
      referencedOps,
      schemaOps
    );

    if (crossValidationWarnings.length > 0) {
      crossValidationSpinner.warn(
        `Cross-validation found ${crossValidationWarnings.length} warning(s)`
      );
      allWarnings.push(...crossValidationWarnings);
    } else {
      crossValidationSpinner.succeed('Cross-validation passed');
    }
  }

  // ===== Print Detailed Errors =====
  if (allErrors.length > 0) {
    console.log(chalk.red('\nErrors:'));
    printErrors(allErrors, 'error');
  }

  if (allWarnings.length > 0) {
    console.log(chalk.yellow('\nWarnings:'));
    printErrors(allWarnings, 'warning');
  }

  // ===== Summary =====
  console.log(chalk.white('\nSummary:'));
  console.log(`  Schema:   ${schemaValid ? chalk.green('✓ Valid') : chalk.red('✗ Invalid')}`);
  console.log(`  Examples: ${examplesValid ? chalk.green('✓ Valid') : chalk.red('✗ Invalid')}`);
  console.log(`  Errors:   ${errorsValid ? chalk.green('✓ Valid') : chalk.red('✗ Invalid')}`);

  // ===== Final Result =====
  const hasErrors = allErrors.length > 0;
  const hasWarnings = allWarnings.length > 0;
  const failDueToStrict = options.strict && hasWarnings;

  if (hasErrors || failDueToStrict) {
    const errorCount = allErrors.length;
    const warningCount = allWarnings.length;
    let message = '\nValidation failed';

    const parts: string[] = [];
    if (errorCount > 0) {
      parts.push(`${errorCount} error(s)`);
    }
    if (warningCount > 0) {
      parts.push(`${warningCount} warning(s)`);
    }
    if (parts.length > 0) {
      message += ` with ${parts.join(' and ')}`;
    }
    message += '.';

    if (failDueToStrict && !hasErrors) {
      message += ' (--strict mode treats warnings as errors)';
    }

    console.log(chalk.red(message) + '\n');
    process.exit(1);
  } else {
    let message = '\nValidation successful!';
    if (hasWarnings) {
      message += ` (${allWarnings.length} warning(s))`;
    }
    console.log(chalk.green(message) + '\n');
    process.exit(0);
  }
}
