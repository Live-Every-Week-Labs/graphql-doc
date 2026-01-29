# Transformer Module

The Transformer module is responsible for converting the parsed GraphQL schema and external metadata into the internal documentation model (`DocModel`) used for generation.

## Responsibilities

1.  **Metadata Merging**: Combines parsed operations with examples and error definitions from external JSON files.
2.  **Type Normalization**: Produces reference-based type trees so each schema type is defined once and reused by reference.
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

Builds reference-first representations of GraphQL types:

- **Reference Output**: Operation arguments/return types and type fields use `TYPE_REF` (or `CIRCULAR_REF`) for schema-defined types instead of embedding full definitions.
- **Central Definitions**: The `types` array in the `DocModel` contains the single source of truth for each type definition (enums, inputs, objects, unions, scalars).
- **Circular Reference Detection**: Direct self-references are marked based on `showCircularReferences`:
  - `true`: Returns `CIRCULAR_REF` kind with a circular indicator.
  - `false`: Returns `TYPE_REF` kind as a plain link.

### `DocModel`

The output structure:

```typescript
interface DocModel {
  sections: Section[];
  types: ExpandedType[];
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
