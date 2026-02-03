# Adapters Module

This module contains adapters for converting the internal documentation model (`DocModel`) into specific output formats.

## Docusaurus Adapter

The `DocusaurusAdapter` converts the internal model into a file structure and content format compatible with Docusaurus.

### Responsibilities

1.  **File Structure**: Maps the `Section` and `Subsection` hierarchy to a nested directory structure.
2.  **Front Matter**: Generates Docusaurus-compatible YAML front matter for MDX files (id, title, sidebar_label, tags, `api: true`).
3.  **Content Generation**: Uses `MdxRenderer` to generate component-based MDX.
4.  **Shared Data Files**: Emits `_data/operations.json` and `_data/types.json` so MDX files import shared maps instead of inlining payloads.
5.  **Navigation**: Generates `_category_.json` files to control the Docusaurus sidebar structure and ordering.
6.  **Sidebar Generation**: Merges into an existing `sidebars.js` by default (updates `apiSidebar`) or generates a new `sidebars.js` if none exists. Can be configured to emit a separate file instead.
7.  **Intro Docs & Section Headers**: Prepends configurable intro docs and optional section headers to the API sidebar.

### Usage

```typescript
import { DocusaurusAdapter } from './docusaurus-adapter';

const adapter = new DocusaurusAdapter();
const files = adapter.adapt(docModel);

// files is an array of GeneratedFile objects:
// {
//   path: 'users/get-user.mdx',
//   content: '---\nid: get-user\napi: true\n...',
//   type: 'mdx'
// }
```

### Sidebar Merging

The adapter intelligently handles existing `sidebars.js` files:

- **No existing sidebar**: Generates `sidebars.js` exporting the API sidebar.
- **Existing sidebar (default)**: Merges into `sidebars.js` and updates the `apiSidebar` key.
- **Separate file**: Set `sidebarMerge: false` (or `sidebarFile: './sidebars.api.js'`) to emit a
  standalone sidebar array you can import manually.

If you generate a separate file, import it into your main configuration:

```javascript
// sidebars.js
const apiSidebar = require('./sidebars.api.js');

module.exports = {
  ...apiSidebar,
  myOtherSidebar: [ ... ],
};
```
