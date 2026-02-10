import path from 'path';
import chalk from 'chalk';
import ora, { Ora } from 'ora';
import { loadGeneratorConfig, resolveConfigPaths } from '../../core/config/loader.js';
import { getExamplePatterns } from '../../core/metadata/example-sources.js';
import { loadExamples } from '../../core/metadata/example-loader.js';
import {
  SchemaValidator,
  MetadataValidator,
  ValidationError,
  validateOperationExampleCoverage,
} from '../../core/validation/index.js';
import { formatPathForMessage, getErrorMessage } from '../../core/utils/index.js';
import { resolveSchemaPointer } from '../schema-resolver.js';

export interface ValidateOptions {
  schema?: string;
  config?: string;
  strict?: boolean;
  json?: boolean;
  verbose?: boolean;
  quiet?: boolean;
  targetDir?: string; // For testing - defaults to process.cwd()
}

export interface ValidateResult {
  success: boolean;
  schemaValid: boolean;
  examplesValid: boolean;
  strictMode: boolean;
  failedDueToStrict: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

function createSpinner(text: string, quiet: boolean): Ora | null {
  if (quiet) {
    return null;
  }

  return ora(text).start();
}

function spinnerSucceed(spinner: Ora | null, message: string, quiet: boolean): void {
  if (spinner) {
    spinner.succeed(message);
    return;
  }

  if (!quiet) {
    console.log(chalk.green(message));
  }
}

function spinnerFail(spinner: Ora | null, message: string, quiet: boolean): void {
  if (spinner) {
    spinner.fail(message);
    return;
  }

  if (!quiet) {
    console.error(chalk.red(message));
  }
}

function spinnerWarn(spinner: Ora | null, message: string, quiet: boolean): void {
  if (spinner) {
    spinner.warn(message);
    return;
  }

  if (!quiet) {
    console.warn(chalk.yellow(message));
  }
}

function resolveSchemaPointers(
  schemaPointer: string | string[],
  targetDir: string
): string | string[] {
  const resolvePointer = (pointer: string) => {
    const isRemoteSchema = /^https?:\/\//i.test(pointer);
    return isRemoteSchema || path.isAbsolute(pointer) ? pointer : path.resolve(targetDir, pointer);
  };

  return Array.isArray(schemaPointer)
    ? schemaPointer.map(resolvePointer)
    : resolvePointer(schemaPointer);
}

/**
 * Print validation errors/warnings grouped by file
 */
function printErrors(errors: ValidationError[], type: 'error' | 'warning', rootPath: string): void {
  const icon = type === 'error' ? chalk.red('  ✗') : chalk.yellow('  ⚠');
  const colorFn = type === 'error' ? chalk.red : chalk.yellow;

  const byFile = new Map<string, ValidationError[]>();
  for (const error of errors) {
    const displayFile = formatPathForMessage(error.file, rootPath);
    const existing = byFile.get(displayFile) || [];
    existing.push(error);
    byFile.set(displayFile, existing);
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
  if (options.verbose && options.quiet) {
    throw new Error('--verbose and --quiet cannot be used together');
  }

  const targetDir = options.targetDir ?? process.cwd();
  const jsonMode = options.json === true;
  const quiet = options.quiet === true || jsonMode;
  const verbose = options.verbose === true;

  if (!quiet) {
    console.log(chalk.blue('\nGraphQL Docs Validator\n'));
  }

  // Load configuration
  let config;
  try {
    config = await loadGeneratorConfig(targetDir, options.config);
  } catch (error) {
    throw new Error(`Failed to load config: ${getErrorMessage(error)}`);
  }

  config = resolveConfigPaths(config, targetDir);

  const schemaPointer = await resolveSchemaPointer(options, targetDir, {
    silent: quiet,
    log: verbose && !quiet ? (message) => console.log(chalk.dim(message)) : undefined,
  });
  const resolvedSchemaPath = resolveSchemaPointers(schemaPointer, targetDir);
  const schemaExtensions = config.schemaExtensions ?? [];
  const schemaPointers = schemaExtensions.length
    ? Array.isArray(resolvedSchemaPath)
      ? [...schemaExtensions, ...resolvedSchemaPath]
      : [...schemaExtensions, resolvedSchemaPath]
    : resolvedSchemaPath;

  if (verbose && !quiet) {
    const schemaLabel = Array.isArray(schemaPointers) ? schemaPointers.join(', ') : schemaPointers;
    console.log(chalk.dim(`Validating schema pointer(s): ${schemaLabel}`));
  }

  const schemaValidator = new SchemaValidator();
  const metadataValidator = new MetadataValidator();

  const allErrors: ValidationError[] = [];
  const allWarnings: ValidationError[] = [];
  let schemaValid = false;
  let examplesValid = false;
  let operationNames: string[] = [];

  // ===== Schema Validation =====
  const schemaSpinner = createSpinner('Validating schema...', quiet);

  const schemaResult = await schemaValidator.validate(schemaPointers);
  operationNames = schemaResult.operationNames;

  if (schemaResult.errors.length > 0) {
    spinnerFail(schemaSpinner, 'Schema validation failed', quiet);
    allErrors.push(...schemaResult.errors);
  } else {
    spinnerSucceed(
      schemaSpinner,
      `Schema syntax valid (${operationNames.length} operations found)`,
      quiet
    );
    schemaValid = true;
  }
  allWarnings.push(...schemaResult.warnings);

  // ===== Examples Validation =====
  const examplePatterns = getExamplePatterns(config);
  const examplesSourceDisplay = examplePatterns
    .map((pattern) =>
      path.isAbsolute(pattern) ? path.relative(targetDir, pattern) || pattern : pattern
    )
    .join(', ');

  const examplesSpinner = createSpinner('Validating example files...', quiet);
  const examplesResult = await metadataValidator.validateExamples(examplePatterns);

  if (examplesResult.errors.length > 0) {
    spinnerFail(examplesSpinner, 'Example files validation failed', quiet);
    allErrors.push(...examplesResult.errors);
  } else {
    const fileCount = new Set(examplesResult.referencedOperations).size;
    spinnerSucceed(
      examplesSpinner,
      `Example files valid (${fileCount} operations documented)`,
      quiet
    );
    examplesValid = true;
  }
  allWarnings.push(...examplesResult.warnings);

  // ===== Cross-validation =====
  if (schemaValid) {
    const crossValidationSpinner = createSpinner('Cross-validating operations...', quiet);

    const referencedOps = new Map<string, string[]>();
    for (const op of examplesResult.referencedOperations) {
      const existing = referencedOps.get(op) || [];
      existing.push(examplesSourceDisplay);
      referencedOps.set(op, existing);
    }

    const schemaOps = new Set(operationNames);
    const crossValidationWarnings = metadataValidator.crossValidateOperations(
      referencedOps,
      schemaOps
    );

    if (crossValidationWarnings.length > 0) {
      spinnerWarn(
        crossValidationSpinner,
        `Cross-validation found ${crossValidationWarnings.length} warning(s)`,
        quiet
      );
      allWarnings.push(...crossValidationWarnings);
    } else {
      spinnerSucceed(crossValidationSpinner, 'Cross-validation passed', quiet);
    }
  }

  // ===== Example Coverage Validation =====
  if (config.requireExamplesForDocumentedOperations && schemaValid && examplesValid) {
    const coverageSpinner = createSpinner('Validating required example coverage...', quiet);

    try {
      const examples = await loadExamples(examplePatterns);
      const coverageErrors = validateOperationExampleCoverage(schemaResult.operations, examples, {
        excludeDocGroups: config.excludeDocGroups,
        examplesLocation: examplesSourceDisplay,
      });

      if (coverageErrors.length > 0) {
        spinnerFail(
          coverageSpinner,
          `Missing examples for ${coverageErrors.length} operation(s)`,
          quiet
        );
        allErrors.push(...coverageErrors);
      } else {
        spinnerSucceed(coverageSpinner, 'Required example coverage passed', quiet);
      }
    } catch (error) {
      spinnerFail(coverageSpinner, 'Required example coverage check failed', quiet);
      allErrors.push({
        file: examplesSourceDisplay || 'examples',
        message: `Failed to validate required example coverage: ${getErrorMessage(error)}`,
        severity: 'error',
        code: 'INVALID_JSON',
      });
    }
  }

  if (!quiet) {
    if (allErrors.length > 0) {
      console.log(chalk.red('\nErrors:'));
      printErrors(allErrors, 'error', targetDir);
    }

    if (allWarnings.length > 0) {
      console.log(chalk.yellow('\nWarnings:'));
      printErrors(allWarnings, 'warning', targetDir);
    }

    console.log(chalk.white('\nSummary:'));
    console.log(`  Schema:   ${schemaValid ? chalk.green('✓ Valid') : chalk.red('✗ Invalid')}`);
    console.log(`  Examples: ${examplesValid ? chalk.green('✓ Valid') : chalk.red('✗ Invalid')}`);
  }

  const hasErrors = allErrors.length > 0;
  const hasWarnings = allWarnings.length > 0;
  const failDueToStrict = options.strict === true && hasWarnings;
  const success = !(hasErrors || failDueToStrict);

  const result: ValidateResult = {
    success,
    schemaValid,
    examplesValid,
    strictMode: options.strict === true,
    failedDueToStrict: failDueToStrict,
    errors: allErrors,
    warnings: allWarnings,
  };

  if (jsonMode) {
    console.log(JSON.stringify(result, null, 2));
  }

  if (!quiet) {
    if (!success) {
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
    } else {
      let message = '\nValidation successful!';
      if (hasWarnings) {
        message += ` (${allWarnings.length} warning(s))`;
      }
      console.log(chalk.green(message) + '\n');
    }
  }

  if (!success) {
    throw new Error('Validation failed');
  }

  return;
}
