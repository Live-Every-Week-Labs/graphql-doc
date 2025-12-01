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
const transformer = new Transformer(types, {
  maxDepth: 5,
  defaultLevels: 2,
  showCircularReferences: true,
});
const docModel = transformer.transform(operations, exampleFiles, errorFiles);
```

### `TypeExpander`

Handles the intelligent expansion of GraphQL types.

- **Recursion Control**:
  - `maxDepth` (default: 5): Hard limit on recursion. Types at this depth have empty fields.
  - `defaultLevels` (default: 2): Soft limit for UI. Types at depth >= defaultLevels are marked `isCollapsible` but still include field data.
- **Circular Reference Detection**: Detects cycles and marks them based on `showCircularReferences` config:
  - `true`: Returns `CIRCULAR_REF` kind with "(circular)" indicator in output.
  - `false`: Returns `TYPE_REF` kind as a plain link (no indicator).
- **Collapsible Support**: Marks types beyond `defaultLevels` as `isCollapsible`, allowing UI to render them as expandable sections.

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
