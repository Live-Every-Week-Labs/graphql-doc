import fs from 'fs-extra';
import {
  parse,
  GraphQLError,
  DocumentNode,
  FieldDefinitionNode,
  ObjectTypeDefinitionNode,
  ObjectTypeExtensionNode,
  DirectiveNode,
  valueFromASTUntyped,
} from 'graphql';
import { z } from 'zod';
import { ValidationError, SchemaValidationResult, ValidationErrorCode } from './types.js';

// Zod schemas for directive validation (matching directive-definitions.ts requirements)
const DocGroupArgsSchema = z.object({
  name: z.string(),
  order: z.number().int().optional(),
  subsection: z.string().optional(),
});

const DocPriorityArgsSchema = z.object({
  level: z.number().int(),
});

const DocTagsArgsSchema = z.object({
  tags: z.array(z.string()),
});
const DocIgnoreArgsSchema = z.object({}).strict();

// Known custom directives
const KNOWN_DOC_DIRECTIVES = ['docGroup', 'docPriority', 'docTags', 'docIgnore'];

/**
 * Validates a GraphQL schema file for syntax and custom directive usage
 */
export class SchemaValidator {
  /**
   * Validate a schema file
   * @param schemaPath Path to the GraphQL schema file
   * @returns Validation result with errors, warnings, and operation names
   */
  async validate(schemaPath: string): Promise<SchemaValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const operationNames: string[] = [];

    // Check if file exists
    if (!(await fs.pathExists(schemaPath))) {
      errors.push({
        file: schemaPath,
        message: `Schema file not found: ${schemaPath}`,
        severity: 'error',
        code: 'SCHEMA_NOT_FOUND',
      });
      return {
        valid: false,
        errors,
        warnings,
        operationNames,
      };
    }

    // Read schema file
    let sdl: string;
    try {
      sdl = await fs.readFile(schemaPath, 'utf-8');
    } catch (error) {
      errors.push({
        file: schemaPath,
        message: `Failed to read schema file: ${(error as Error).message}`,
        severity: 'error',
        code: 'SCHEMA_LOAD_ERROR',
      });
      return {
        valid: false,
        errors,
        warnings,
        operationNames,
      };
    }

    // Parse SDL to AST
    let document: DocumentNode;
    try {
      document = parse(sdl);
    } catch (error) {
      const gqlError = error as GraphQLError;
      errors.push({
        file: schemaPath,
        line: gqlError.locations?.[0]?.line,
        column: gqlError.locations?.[0]?.column,
        message: gqlError.message,
        severity: 'error',
        code: 'SCHEMA_PARSE_ERROR',
      });
      return {
        valid: false,
        errors,
        warnings,
        operationNames,
      };
    }

    // Extract operation types and validate directives
    for (const definition of document.definitions) {
      if (definition.kind === 'ObjectTypeDefinition' || definition.kind === 'ObjectTypeExtension') {
        const typeDef = definition as ObjectTypeDefinitionNode | ObjectTypeExtensionNode;
        const typeName = typeDef.name.value;

        // Check if this is a root operation type
        const isRootType = ['Query', 'Mutation', 'Subscription'].includes(typeName);

        if (isRootType && typeDef.fields) {
          for (const field of typeDef.fields) {
            // Collect operation names
            operationNames.push(field.name.value);

            // Validate directives on this field
            const directiveErrors = this.validateFieldDirectives(field, schemaPath);
            errors.push(...directiveErrors.errors);
            warnings.push(...directiveErrors.warnings);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      operationNames,
    };
  }

  /**
   * Validate directives on a field definition
   */
  private validateFieldDirectives(
    field: FieldDefinitionNode,
    schemaPath: string
  ): { errors: ValidationError[]; warnings: ValidationError[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    if (!field.directives || field.directives.length === 0) {
      return { errors, warnings };
    }

    for (const directive of field.directives) {
      const directiveName = directive.name.value;
      const location = directive.loc;

      // Check if it's a known doc directive
      if (KNOWN_DOC_DIRECTIVES.includes(directiveName)) {
        const args = this.extractDirectiveArgs(directive);
        const validationResult = this.validateDirectiveArgs(
          directiveName,
          args,
          schemaPath,
          location?.startToken.line,
          location?.startToken.column
        );
        errors.push(...validationResult.errors);
        warnings.push(...validationResult.warnings);
      }
    }

    return { errors, warnings };
  }

  /**
   * Extract arguments from a directive node
   */
  private extractDirectiveArgs(directive: DirectiveNode): Record<string, unknown> {
    const args: Record<string, unknown> = {};

    if (directive.arguments) {
      for (const arg of directive.arguments) {
        args[arg.name.value] = valueFromASTUntyped(arg.value);
      }
    }

    return args;
  }

  /**
   * Validate directive arguments against their schemas
   */
  private validateDirectiveArgs(
    directiveName: string,
    args: Record<string, unknown>,
    schemaPath: string,
    line?: number,
    column?: number
  ): { errors: ValidationError[]; warnings: ValidationError[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    let schema: z.ZodSchema;
    switch (directiveName) {
      case 'docGroup':
        schema = DocGroupArgsSchema;
        break;
      case 'docPriority':
        schema = DocPriorityArgsSchema;
        break;
      case 'docTags':
        schema = DocTagsArgsSchema;
        break;
      case 'docIgnore':
        schema = DocIgnoreArgsSchema;
        break;
      default:
        return { errors, warnings };
    }

    const result = schema.safeParse(args);
    if (!result.success) {
      for (const issue of result.error.issues) {
        const fieldPath = issue.path.join('.');
        let code: ValidationErrorCode = 'DIRECTIVE_INVALID_ARG';
        let message = `Invalid @${directiveName}: ${issue.message}`;

        if (issue.code === 'invalid_type' && issue.received === 'undefined') {
          code = 'DIRECTIVE_MISSING_ARG';
          message = `@${directiveName} missing required argument "${fieldPath}"`;
        } else if (fieldPath) {
          message = `@${directiveName} argument "${fieldPath}": ${issue.message}`;
        }

        errors.push({
          file: schemaPath,
          line,
          column,
          message,
          severity: 'error',
          code,
        });
      }
    }

    return { errors, warnings };
  }
}
