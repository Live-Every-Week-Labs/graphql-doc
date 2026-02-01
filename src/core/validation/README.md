# Validation Module

This module provides validation services for GraphQL schemas and metadata files. It is used by the `validate` CLI command to check for errors before generating documentation.

## Components

### Types

- **`types.ts`**: Defines validation result types, error codes, and interfaces.

### Validators

- **`schema-validator.ts`**: Validates GraphQL schema files.
  - Checks SDL syntax validity
- Validates custom directive usage (`@docGroup`, `@docPriority`, `@docTags`, `@docIgnore`)
  - Extracts operation names for cross-validation

- **`metadata-validator.ts`**: Validates metadata JSON files.
  - Validates example files against Zod schemas
  - Validates error files against Zod schemas
  - Cross-validates that referenced operations exist in the schema

## Usage

```typescript
import { SchemaValidator, MetadataValidator } from './validation';

// Validate schema
const schemaValidator = new SchemaValidator();
const schemaResult = await schemaValidator.validate('schema.graphql');

// Validate metadata
const metadataValidator = new MetadataValidator();
const examplesResult = await metadataValidator.validateExamples('docs-metadata/examples/**/*.json');
const errorsResult = await metadataValidator.validateErrors('docs-metadata/errors/**/*.json');

// Cross-validate operations
const warnings = metadataValidator.crossValidateOperations(
  referencedOperations,
  new Set(schemaResult.operationNames)
);
```

## Error Codes

| Code                     | Description                         |
| ------------------------ | ----------------------------------- |
| `SCHEMA_NOT_FOUND`       | Schema file does not exist          |
| `SCHEMA_PARSE_ERROR`     | Invalid GraphQL SDL syntax          |
| `SCHEMA_LOAD_ERROR`      | Failed to read schema file          |
| `DIRECTIVE_MISSING_ARG`  | Required directive argument missing |
| `DIRECTIVE_INVALID_ARG`  | Directive argument has wrong type   |
| `INVALID_JSON`           | JSON file has syntax errors         |
| `MISSING_REQUIRED_FIELD` | Required field missing in JSON      |
| `INVALID_OPERATION_TYPE` | Invalid operationType value         |
| `INVALID_RESPONSE`       | Invalid response type value         |
| `UNKNOWN_OPERATION`      | Referenced operation not in schema  |

## Validation Results

All validators return structured results with:

- `valid`: Boolean indicating success
- `errors`: Array of validation errors
- `warnings`: Array of validation warnings
- Additional context (e.g., `operationNames`, `referencedOperations`)
