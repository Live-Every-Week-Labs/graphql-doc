# Adapters Module

This module contains adapters for converting the internal documentation model (`DocModel`) into specific output formats.

## Docusaurus Adapter

The `DocusaurusAdapter` converts the internal model into a file structure and content format compatible with Docusaurus.

### Responsibilities

1.  **File Structure**: Maps the `Section` and `Subsection` hierarchy to a nested directory structure.
2.  **Front Matter**: Generates Docusaurus-compatible YAML front matter for MDX files (id, title, sidebar_label, tags, `api: true`).
3.  **Content Generation**: Uses `MdxRenderer` to generate component-based MDX.
4.  **Navigation**: Generates `_category_.json` files to control the Docusaurus sidebar structure and ordering.
5.  **Sidebar Generation**: Automatically generates a `sidebars.js` file (or `sidebars.api.js` if one already exists) to provide a complete navigation structure for the API documentation.

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
- **Existing sidebar**: Generates `sidebars.api.js` exporting only the API sidebar items.

Users can then import the generated sidebar into their main configuration:

```javascript
// sidebars.js
const apiSidebar = require('./sidebars.api.js');

module.exports = {
  ...apiSidebar,
  myOtherSidebar: [ ... ],
};
```
