import { glob } from 'glob';
import fs from 'fs-extra';
import path from 'path';
import { z } from 'zod';
import { ExampleFileEntrySchema, ErrorFileSchema } from '../metadata/validator.js';
import { ValidationError, MetadataValidationResult, ValidationErrorCode } from './types.js';

/**
 * Validates metadata files (examples and errors) against their schemas
 */
export class MetadataValidator {
  /**
   * Validate example files matching a glob pattern
   * @param pattern Glob pattern for example files (e.g., "docs-metadata/examples/**\/*.json")
   * @returns Validation result with errors, warnings, and referenced operations
   */
  async validateExamples(pattern: string): Promise<MetadataValidationResult> {
    return this.validateFiles(
      pattern,
      ExampleFileEntrySchema,
      'example',
      (content) => [content.operation],
      { allowArray: true }
    );
  }

  /**
   * Validate error files matching a glob pattern
   * @param pattern Glob pattern for error files (e.g., "docs-metadata/errors/**\/*.json")
   * @returns Validation result with errors, warnings, and referenced operations
   */
  async validateErrors(pattern: string): Promise<MetadataValidationResult> {
    return this.validateFiles(pattern, ErrorFileSchema, 'error', (content) =>
      content.operations.filter((op: string) => op !== '*')
    );
  }

  /**
   * Cross-validate that referenced operations exist in the schema
   * @param referencedOperations Operations referenced in metadata files
   * @param schemaOperations Operations defined in the schema
   * @param metadataFiles Map of operation names to file paths for error reporting
   * @returns List of warnings for unknown operations
   */
  crossValidateOperations(
    referencedOperations: Map<string, string[]>,
    schemaOperations: Set<string>
  ): ValidationError[] {
    const warnings: ValidationError[] = [];

    for (const [operation, files] of referencedOperations) {
      if (!schemaOperations.has(operation)) {
        for (const file of files) {
          warnings.push({
            file,
            message: `Operation "${operation}" not found in schema`,
            severity: 'warning',
            code: 'UNKNOWN_OPERATION',
          });
        }
      }
    }

    return warnings;
  }

  /**
   * Generic file validation
   */
  private async validateFiles<T extends z.ZodSchema>(
    pattern: string,
    schema: T,
    fileType: 'example' | 'error',
    extractOperations: (content: z.infer<T>) => string[],
    options?: { allowArray?: boolean }
  ): Promise<MetadataValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const referencedOperations: string[] = [];

    // Find files matching pattern
    let files: string[];
    try {
      files = await glob(pattern);
    } catch (error) {
      errors.push({
        file: pattern,
        message: `Failed to search for ${fileType} files: ${(error as Error).message}`,
        severity: 'error',
        code: 'INVALID_JSON',
      });
      return { valid: false, errors, warnings, referencedOperations };
    }

    // Validate each file
    for (const file of files) {
      const fileErrors = await this.validateFile(
        file,
        schema,
        fileType,
        extractOperations,
        referencedOperations,
        options
      );
      errors.push(...fileErrors.errors);
      warnings.push(...fileErrors.warnings);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      referencedOperations,
    };
  }

  /**
   * Validate a single metadata file
   */
  private async validateFile<T extends z.ZodSchema>(
    filePath: string,
    schema: T,
    fileType: 'example' | 'error',
    extractOperations: (content: z.infer<T>) => string[],
    referencedOperations: string[],
    options?: { allowArray?: boolean }
  ): Promise<{ errors: ValidationError[]; warnings: ValidationError[] }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const relativePath = path.relative(process.cwd(), filePath);

    // Read file
    let content: unknown;
    try {
      const rawContent = await fs.readFile(filePath, 'utf-8');
      content = JSON.parse(rawContent);
    } catch (error) {
      const err = error as Error;
      let line: number | undefined;
      let column: number | undefined;

      // Try to extract line/column from JSON parse error
      const positionMatch = err.message.match(/position (\d+)/i);
      if (positionMatch) {
        const position = parseInt(positionMatch[1], 10);
        try {
          const rawContent = await fs.readFile(filePath, 'utf-8');
          const { line: l, column: c } = this.getLineAndColumn(rawContent, position);
          line = l;
          column = c;
        } catch {
          // Ignore error getting position
        }
      }

      errors.push({
        file: relativePath,
        line,
        column,
        message: `Invalid JSON: ${err.message}`,
        severity: 'error',
        code: 'INVALID_JSON',
      });
      return { errors, warnings };
    }

    const pushIssues = (issues: z.ZodIssue[], prefix?: string) => {
      for (const issue of issues) {
        const rawPath = issue.path.join('.');
        const fieldPath = prefix ? `${prefix}.${rawPath}` : rawPath;
        let code: ValidationErrorCode = 'INVALID_FIELD_TYPE';
        let message = issue.message;

        if (issue.code === 'invalid_type' && issue.received === 'undefined') {
          code = 'MISSING_REQUIRED_FIELD';
          message = `Missing required field "${fieldPath}"`;
        } else if (issue.code === 'invalid_enum_value') {
          if (fieldPath.includes('operationType')) {
            code = 'INVALID_OPERATION_TYPE';
          } else if (fieldPath.includes('response.type')) {
            code = 'INVALID_RESPONSE';
          }
          message = `Invalid value for "${fieldPath}": ${issue.message}`;
        } else if (fieldPath) {
          message = `Field "${fieldPath}": ${issue.message}`;
        }

        errors.push({
          file: relativePath,
          message,
          severity: 'error',
          code,
        });
      }
    };

    if (options?.allowArray && Array.isArray(content)) {
      content.forEach((entry, index) => {
        const entryResult = schema.safeParse(entry);
        if (!entryResult.success) {
          pushIssues(entryResult.error.issues, `[${index}]`);
        } else {
          const ops = extractOperations(entryResult.data);
          referencedOperations.push(...ops);
        }
      });
      return { errors, warnings };
    }

    const result = schema.safeParse(content);
    if (!result.success) {
      pushIssues(result.error.issues);
    } else {
      const ops = extractOperations(result.data);
      referencedOperations.push(...ops);
    }

    return { errors, warnings };
  }

  /**
   * Convert a character position to line and column numbers
   */
  private getLineAndColumn(content: string, position: number): { line: number; column: number } {
    let line = 1;
    let column = 1;

    for (let i = 0; i < position && i < content.length; i++) {
      if (content[i] === '\n') {
        line++;
        column = 1;
      } else {
        column++;
      }
    }

    return { line, column };
  }
}
