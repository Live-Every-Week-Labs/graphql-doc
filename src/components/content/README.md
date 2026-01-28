# Content Components

This directory contains components responsible for rendering the content of the GraphQL documentation.

## Components

### `TypeViewer`

The `TypeViewer` is a recursive component that renders `ExpandedType` objects. It handles the visualization of complex GraphQL types, including nested objects, lists, and unions.

**Features:**

- Recursive rendering with depth control (`maxDepth`, `defaultExpandedLevels`).
- Expandable/collapsible sections for Objects, Unions, and Enums.
- Handles circular references gracefully.
- Proper visualization of Lists (e.g., `[Type]`).
- Themed styling using `graphql-docs.css`.

**Usage:**

```tsx
import { TypeViewer } from './TypeViewer';
import { ExpandedType } from '../../core/transformer/types';

const myType: ExpandedType = { ... };

<TypeViewer
  type={myType}
  depth={0}
  defaultExpandedLevels={2}
  maxDepth={5}
/>
```

**Props:**

- `type` (`ExpandedType`): The type definition to render.
- `depth` (`number`): Current recursion depth (default: 0).
- `defaultExpandedLevels` (`number`): How many levels deep to expand initially (default: 2).
- `maxDepth` (`number`): Maximum recursion depth before truncating (default: 10).

### `FieldTable`

The `FieldTable` component renders a list of fields for an object type in a structured, readable table format.

**Features:**

- Responsive table layout (collapses on mobile).
- Displays Field Name, Type (via `TypeViewer`), and Description.
- Visual indicators for **Required** fields (\*) and **Deprecated** fields (strikethrough + badge).
- Supporting nested arguments for fields.
- Hover effects for better readability.

**Usage:**

```tsx
import { FieldTable } from './FieldTable';
import { ExpandedField } from '../../core/transformer/types';

const fields: ExpandedField[] = [ ... ];

<FieldTable
  fields={fields}
  depth={1}
  maxDepth={5}
  defaultExpandedLevels={2}
/>
```

**Props:**

- `fields` (`ExpandedField[]`): Array of fields to render.
- `depth` (`number`): Current recursion depth.
- `maxDepth` (`number`): Max recursion depth (passed to child `TypeViewer`s).
- `defaultExpandedLevels` (`number`): Expansion level control (passed to child `TypeViewer`s).

### `ArgumentsTable`

The `ArgumentsTable` component renders operation arguments with required indicators, types, defaults, and descriptions.

**Usage:**

```tsx
import { ArgumentsTable } from './ArgumentsTable';
import { ExpandedArgument } from '../../core/transformer/types';

const args: ExpandedArgument[] = [ ... ];

<ArgumentsTable
  arguments={args}
  depth={0}
  maxDepth={5}
  defaultExpandedLevels={2}
/>
```

### `OperationView`

`OperationView` renders a complete GraphQL operation with its description, arguments, return type, and inline examples (mobile). It also emits `data-operation` for scroll sync and anchors via `slugify()`.

**Usage:**

```tsx
import { OperationView } from './OperationView';
import { Operation } from '../../core/transformer/types';

const operation: Operation = { ... };

<OperationView operation={operation} />
```
