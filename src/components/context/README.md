# Context Providers

This directory contains React Context providers used to manage global state within the documentation components.

## ExpansionProvider

The `ExpansionProvider` manages the expansion/collapse state of nested type definitions and other hierarchical content.

### Features

- **Depth-aware defaults**: Automatically collapses items deeper than a configured level.
- **Global Modes**: Supports 'Expand All' and 'Collapse All' actions.
- **Granular Overrides**: Tracks user toggles safely. If a user manually toggles an item, that state is preserved independently of the global mode or default depth.
- **Branch Independence**: Each path is tracked uniquely, ensuring that expanding one deep branch does not affect siblings.

### Usage

Wrap your application or component tree with the provider:

```tsx
import { ExpansionProvider } from '@graphql-docs/generator/components';

function App() {
  return (
    <ExpansionProvider>
      <DocLayout />
    </ExpansionProvider>
  );
}
```

Consume the context implementation in child components:

```tsx
import { useExpansion } from '@graphql-docs/generator/components';

function TypeNode({ path, depth }) {
  const { isExpanded, toggleExpand } = useExpansion();
  const defaultLevels = 2; // Typically passed from config

  const expanded = isExpanded(path, depth, defaultLevels);

  return (
    <div>
      <button onClick={() => toggleExpand(path, expanded)}>
        {expanded ? '-' : '+'}
      </button>
      {expanded && <Children ... />}
    </div>
  );
}
```

### API

`useExpansion()` returns:

| Property | Type | Description |
| copy | --- | --- |
| `isExpanded` | `(path: string, depth: number, defaultLevels: number) => boolean` | Determines if a node should be visible. checks overrides first, then falls back to mode/depth logic. |
| `toggleExpand` | `(path: string, currentExpanded?: boolean) => void` | Toggles the state of a specific path. passing `currentExpanded` is recommended to ensure correct inversion of the _effective_ state. |
| `expandAll` | `() => void` | Sets mode to 'all' and clears overrides. |
| `collapseAll` | `() => void` | Sets mode to 'none' and clears overrides. |
| `mode` | `'default' \| 'all' \| 'none'` | The current global expansion strategy. |
