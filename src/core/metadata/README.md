# Metadata Module

This module handles the loading, validation, and management of external metadata for the documentation generator. It allows users to define examples and error references in separate JSON files, keeping the GraphQL schema clean.

## Components

### Loaders

- **`example-loader.ts`**: Loads example files using glob patterns.
- **`error-loader.ts`**: Loads error definition files using glob patterns.

### Validation

- **`validator.ts`**: Contains Zod schemas to ensure all loaded JSON files adhere to the expected format.
- **`types.ts`**: TypeScript interfaces derived from the Zod schemas.

## Usage

The loaders are designed to be used by the `Transformer` module to merge external metadata with the parsed GraphQL schema.

```typescript
import { loadExamples, loadErrors } from './metadata';

const examples = await loadExamples('docs-metadata/examples/**/*.json');
const errors = await loadErrors('docs-metadata/errors/**/*.json');
```

## File Formats

### Example Files

Defined in `ExampleFileSchema`. Contains examples for a specific operation.

### Error Files

Defined in `ErrorFileSchema`. Contains error definitions that can be mapped to specific operations or globally (`*`).
