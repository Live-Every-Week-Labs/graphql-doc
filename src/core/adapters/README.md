# Adapters Module

This module contains adapters for converting the internal documentation model (`DocModel`) into specific output formats.

## Docusaurus Adapter

The `DocusaurusAdapter` converts the internal model into a file structure and content format compatible with Docusaurus.

### Responsibilities

1.  **File Structure**: Maps the `Section` and `Subsection` hierarchy to a nested directory structure.
2.  **Front Matter**: Generates Docusaurus-compatible YAML front matter for MDX files (id, title, sidebar_label, tags).
3.  **Navigation**: Generates `_category_.json` files to control the Docusaurus sidebar structure and ordering.

### Usage

```typescript
import { DocusaurusAdapter } from './docusaurus-adapter';

const adapter = new DocusaurusAdapter();
const files = adapter.adapt(docModel);

// files is an array of GeneratedFile objects:
// {
//   path: 'users/get-user.mdx',
//   content: '---\nid: get-user\n...',
//   type: 'mdx'
// }
```
