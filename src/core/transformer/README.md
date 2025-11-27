# Transformer Module

The Transformer module is responsible for converting the parsed GraphQL schema and external metadata into the internal documentation model (`DocModel`) used for generation.

## Responsibilities

1.  **Metadata Merging**: Combines parsed operations with examples and error definitions from external JSON files.
2.  **Type Expansion**: Recursively expands GraphQL types (arguments, return types) into a rich, nested structure suitable for documentation.
3.  **Grouping & Sorting**: Organizes operations into sections and subsections based on `@docGroup` directives and sorts them using `@docPriority`.

## Key Components

### `Transformer`

The main class that orchestrates the transformation process.

```typescript
const transformer = new Transformer(types, { defaultDepth: 2 });
const docModel = transformer.transform(operations, exampleFiles, errorFiles);
```

### `TypeExpander`

Handles the intelligent expansion of GraphQL types.

- **Recursion Control**: Limits expansion depth (default: 2) to prevent massive payloads.
- **Circular Reference Detection**: Detects cycles and marks them as `CIRCULAR_REF`.
- **Collapsible Support**: Marks types beyond the depth limit as `isCollapsible`, allowing UI to render them as on-demand details.

### `DocModel`

The output structure:

```typescript
interface DocModel {
  sections: Section[];
}

interface Section {
  name: string;
  subsections: Subsection[];
}

interface Subsection {
  name: string;
  operations: Operation[];
}
```
