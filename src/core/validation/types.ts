/**
 * Validation error representing a single issue found during validation
 */
export interface ValidationError {
  /** File path where the error occurred */
  file: string;
  /** Line number (1-indexed) if available */
  line?: number;
  /** Column number (1-indexed) if available */
  column?: number;
  /** Human-readable error message */
  message: string;
  /** Severity level */
  severity: 'error' | 'warning';
  /** Error code for programmatic handling */
  code: ValidationErrorCode;
}

/**
 * Error codes for different types of validation issues
 */
export type ValidationErrorCode =
  // Schema errors
  | 'SCHEMA_NOT_FOUND'
  | 'SCHEMA_PARSE_ERROR'
  | 'SCHEMA_LOAD_ERROR'
  // Directive errors
  | 'UNKNOWN_DIRECTIVE'
  | 'DIRECTIVE_MISSING_ARG'
  | 'DIRECTIVE_INVALID_ARG'
  | 'DIRECTIVE_WRONG_LOCATION'
  // Metadata errors
  | 'INVALID_JSON'
  | 'MISSING_REQUIRED_FIELD'
  | 'INVALID_FIELD_TYPE'
  | 'INVALID_OPERATION_TYPE'
  | 'INVALID_RESPONSE'
  | 'MISSING_OPERATION_EXAMPLE'
  // Cross-validation errors
  | 'UNKNOWN_OPERATION';

/**
 * Summary of validation results by category
 */
export interface ValidationSummary {
  schemaValid: boolean;
  examplesValid: boolean;
  directivesValid: boolean;
}

/**
 * Complete validation result containing all errors, warnings, and summary
 */
export interface ValidationResult {
  /** True if no errors (warnings are allowed unless strict mode) */
  valid: boolean;
  /** List of validation errors */
  errors: ValidationError[];
  /** List of validation warnings */
  warnings: ValidationError[];
  /** Summary by validation category */
  summary: ValidationSummary;
}

/**
 * Schema validation result
 */
export interface SchemaValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  /** Operation names found in the schema (for cross-validation) */
  operationNames: string[];
  /** Root operation metadata used for higher-level validation checks */
  operations: SchemaOperationMetadata[];
}

/**
 * Metadata validation result (for examples)
 */
export interface MetadataValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  /** Operation names referenced in metadata files */
  referencedOperations: string[];
}

export interface SchemaOperationMetadata {
  name: string;
  directives: {
    docIgnore?: boolean;
    docGroup?: {
      name: string;
    };
  };
}
