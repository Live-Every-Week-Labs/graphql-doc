# Content Components

This directory contains components responsible for rendering the content of the GraphQL documentation.

## Components

### `TypeViewer`

The `TypeViewer` is a recursive component that renders `ExpandedType` objects. It handles the visualization of complex GraphQL types, including nested objects, lists, and unions.

**Features:**

- List-based rendering with inline expansion for object fields.
- Depth-limited expansion (defaults to 3 levels inline).
- Handles circular references and type links gracefully.
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
  defaultExpandedLevels={0}
  maxDepth={3}
/>
```

**Props:**

- `type` (`ExpandedType`): The type definition to render.
- `depth` (`number`): Current recursion depth (default: 0).
- `defaultExpandedLevels` (`number`): How many levels deep to expand initially (default: 0).
- `maxDepth` (`number`): Maximum recursion depth before truncating (default: 3).

### `FieldTable`

The `FieldTable` component renders a list of fields for an object type using a list-based layout.

**Features:**

- List layout that preserves width at deeper nesting levels.
- Displays Field Name, Type, Description, and inline expansion toggle for nested objects.
- Nullable suffix for response/type fields (`| null`), plus a **Required** badge for input-style fields.
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
  maxDepth={3}
  defaultExpandedLevels={0}
/>
```

**Props:**

- `fields` (`ExpandedField[]`): Array of fields to render.
- `requiredStyle` (`'label' | 'indicator'`): Controls required marker style (default: `indicator`).
- `depth` (`number`): Current recursion depth.
- `maxDepth` (`number`): Max inline expansion depth.
- `defaultExpandedLevels` (`number`): Expansion level control.

### `ArgumentsTable`

The `ArgumentsTable` component renders operation arguments with required badges, types, defaults, and descriptions in a list format.

**Usage:**

```tsx
import { ArgumentsTable } from './ArgumentsTable';
import { ExpandedArgument } from '../../core/transformer/types';

const args: ExpandedArgument[] = [ ... ];

<ArgumentsTable
  arguments={args}
  depth={0}
  maxDepth={3}
  defaultExpandedLevels={0}
/>
```

### `OperationView`

`OperationView` renders a complete GraphQL operation with its description, arguments, return type, and inline examples (mobile). It also emits `data-operation` for scroll sync and anchors via `slugify()`. If you pass `typesByName`, referenced types are resolved at render time. Use `typeLinkMode` (`none`, `deep`, `all`) to control type name links.

**Usage:**

```tsx
import { OperationView } from './OperationView';
import { Operation } from '../../core/transformer/types';

const operation: Operation = { ... };

<OperationView operation={operation} typesByName={typesByName} />
```

### `TypeDefinitionView`

`TypeDefinitionView` renders a standalone type definition page. It supports enums (with per-value notes),
inputs, objects, interfaces, unions, and scalars. If you pass `typesByName`, referenced field types are resolved at render time. Use `typeLinkMode` to control type name links.

**Usage:**

```tsx
import { TypeDefinitionView } from './TypeDefinitionView';
import { ExpandedType } from '../../core/transformer/types';

const typeDefinition: ExpandedType = { ... };

<TypeDefinitionView type={typeDefinition} typesByName={typesByName} />
```
