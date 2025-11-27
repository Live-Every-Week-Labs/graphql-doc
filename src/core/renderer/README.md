# Renderer Module

This module is responsible for rendering the internal documentation model into string content (specifically MDX).

## MdxRenderer

The `MdxRenderer` class uses Handlebars to transform `Operation` objects into MDX strings.

### Features

- **Handlebars Integration**: Uses `handlebars` for template-based rendering.
- **Custom Helpers**:
  - `json`: Stringifies objects to JSON.
  - `slugify`: Converts strings to URL-friendly slugs.
  - `eq`: Equality check for templates.
- **Partials**: Registers `arguments`, `type`, and `examples` partials for reuse.

### Usage

```typescript
import { MdxRenderer } from './mdx-renderer';

const renderer = new MdxRenderer();
const mdxContent = renderer.renderOperation(operation);
```
