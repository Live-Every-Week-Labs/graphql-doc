# Renderer Module

This module is responsible for rendering the internal documentation model into string content (specifically MDX).

## MdxRenderer

The `MdxRenderer` class uses Handlebars to transform `Operation` objects into MDX strings that render the React component library.

### Features

- **Handlebars Integration**: Uses `handlebars` for template-based rendering.
- **Custom Helpers**:
  - `json`: Stringifies objects to JSON.
  - `slugify`: Converts strings to URL-friendly slugs.
- **Component Output**: Emits `<OperationView />` with static props export.

### Usage

```typescript
import { MdxRenderer } from './mdx-renderer';

const renderer = new MdxRenderer();
const mdxContent = renderer.renderOperation(operation, {
  exportName: 'operation',
  headingLevel: 2,
});
```
