# Configuration Guide

The generator can be configured via CLI arguments or a configuration file.

## Configuration File

The generator supports multiple configuration file formats:

- `.graphqlrc` (recommended) - Uses the `extensions.graphql-docs` key
- `graphql-docs.config.js` / `.ts` / `.json`
- `.graphql-docsrc` / `.graphql-docsrc.json`

The generator uses [cosmiconfig](https://github.com/davidtheclark/cosmiconfig) for configuration discovery.

## Configuration Options

### Core Options

| Option                  | Type       | Default      | Description                                                           |
| :---------------------- | :--------- | :----------- | :-------------------------------------------------------------------- |
| `outputDir`             | `string`   | `./docs/api` | Directory where generated documentation will be written               |
| `docsRoot`              | `string`   | `./docs`     | Docusaurus docs root (used to prefix sidebar doc ids)                 |
| `docIdPrefix`           | `string`   |              | Override doc id prefix for sidebars (e.g. `api`)                      |
| `framework`             | `string`   | `docusaurus` | Output framework. Currently only `docusaurus` is supported            |
| `singlePage`            | `boolean`  | `false`      | Generate a single page instead of multiple files                      |
| `schemaExtensions`      | `string[]` | `[]`         | Extra SDL files merged into the schema (framework scalars/directives) |
| `allowRemoteSchema`     | `boolean`  | `false`      | Allow loading schemas from remote URLs (http/https)                   |
| `unsafeMdxDescriptions` | `boolean`  | `false`      | Render schema descriptions as raw MDX (unsafe by default)             |

### Metadata Options

| Option        | Type     | Default                  | Description                             |
| :------------ | :------- | :----------------------- | :-------------------------------------- |
| `metadataDir` | `string` | `./docs-metadata`        | Base directory for example metadata     |
| `examplesDir` | `string` | `{metadataDir}/examples` | Directory containing example JSON files |

### Schema Extensions

Some frameworks (e.g. AppSync, Hasura, Federation) add custom scalars or directives that are not
declared in your SDL. Provide an extensions file to avoid load errors and optionally add notes for
those types.

```yaml
# .graphqlrc
extensions:
  graphql-docs:
    schemaExtensions:
      - ./schema/framework-stubs.graphql
```

You can include descriptions in the extension SDL to show up in the generated type docs.

### Content Options

| Option              | Type                 | Default | Description                                      |
| :------------------ | :------------------- | :------ | :----------------------------------------------- |
| `includeDeprecated` | `boolean`            | `true`  | Include deprecated operations in documentation   |
| `skipTypes`         | `string[]`           | `[]`    | List of type names to exclude from documentation |
| `typeLinkMode`      | `string`             | `none`  | Controls when type names render as links         |
| `excludeDocGroups`  | `string \| string[]` | `[]`    | Doc group names to exclude from generated docs   |

### Sidebar Options

| Option                   | Type      | Default            | Description                                                                               |
| :----------------------- | :-------- | :----------------- | :---------------------------------------------------------------------------------------- |
| `generateSidebar`        | `boolean` | `true`             | Generate Docusaurus sidebar configuration                                                 |
| `sidebarFile`            | `string`  | auto               | Custom sidebar path. `.api.js` writes an array export; otherwise merges/exports an object |
| `sidebarMerge`           | `boolean` | `true`             | Merge into an existing sidebar file when present                                          |
| `sidebarTarget`          | `string`  | `apiSidebar`       | Sidebar key to update when merging                                                        |
| `sidebarInsertPosition`  | `string`  | `replace`          | How to insert items (`replace`, `append`, `prepend`, `before`, `after`)                   |
| `sidebarInsertReference` | `string`  |                    | Label/id/value to insert before/after when using `before`/`after`                         |
| `sidebarCategoryIndex`   | `boolean` | `false`            | When true, category labels link to a generated index page                                 |
| `introDocs`              | `array`   | `[]`               | MD/MDX docs to prepend to the API sidebar                                                 |
| `sidebarSectionLabels`   | `object`  | `Operations/Types` | Labels for sidebar section headers (operations/types)                                     |

When `sidebarMerge` is enabled and the target sidebar file exists, the generator appends a small
injection block that updates the target key (`sidebarTarget`). This preserves any other sidebars in
the file and lets you control placement with `sidebarInsertPosition`.

For `before`/`after`, the generator searches for a matching item by `label`, `id`, or `value`.
If no match is found, it falls back to appending.

If `sidebarFile` ends with `.api.js`, the generator writes a standalone array export and skips
merging. This is useful when you want to import the generated sidebar into another file.

If you want to target a sidebar outside the output directory, pass an absolute `sidebarFile` path.

If your `outputDir` lives under the Docusaurus docs root (default `./docs`), the generator will
automatically prefix sidebar document ids (for example, `api/...` when `outputDir` is `./docs/api`).
Override this with `docIdPrefix` if your docs root is different.

### Single-Page Mode

When `singlePage: true` is set, the generator produces a single `api-reference.mdx` file instead of multiple files per operation. This mode includes:

- **Front matter** with `id: api-reference`, `title: API Reference`, `sidebar_label: API Reference`
- **Table of Contents** with nested anchor links to all sections, subsections, and operations
- **Section headers** with Docusaurus anchor syntax (e.g., `## User Management {#user-management}`)
- **Subsection headers** with composite anchors (e.g., `### Admin {#user-management-admin}`)
- **Operation headers** with anchors (e.g., `#### getUser {#get-user}`)
- **Sidebar with hash links** for in-page navigation (e.g., `api-reference#get-user`)

This mode is ideal for smaller APIs or when you want all documentation on a single scrollable page with full navigation support.

**Example output structure:**

```markdown
---
id: api-reference
title: API Reference
sidebar_label: API Reference
---

# API Reference

## Table of Contents

- [User Management](#user-management)
  - [getUser](#get-user)
  - [Admin](#user-management-admin)
    - [deleteUser](#delete-user)

---

## User Management {#user-management}

#### getUser {#get-user}

[operation content]

---

### Admin {#user-management-admin}

#### deleteUser {#delete-user}

[operation content]
```

**Enable single-page mode:**

```yaml
# .graphqlrc
schema: schema.graphql

extensions:
  graphql-docs:
    outputDir: ./docs/api
    singlePage: true
```

### External Data Mode

The generator always writes shared JSON data files (e.g. `_data/operations.json` and `_data/types.json`).
MDX files import those shared maps instead of embedding the full JSON payload inline. This keeps
individual MDX files small and avoids repeating the same definitions across files.

### Type Link Mode

Control whether type names render as clickable links in generated docs:

| Option         | Type     | Default | Description                                   |
| :------------- | :------- | :------ | :-------------------------------------------- |
| `typeLinkMode` | `string` | `none`  | `none`, `deep`, or `all` (see details below). |

- `none`: No type name links (default).
- `deep`: Only link type names when inline expansion is no longer possible.
- `all`: Link all type name references.

### Unsafe MDX Descriptions

By default, schema descriptions are rendered as plain text to avoid MDX injection risks.
If your schema descriptions are trusted and you want to render them as raw MDX, set:

```yaml
extensions:
  graphql-docs:
    unsafeMdxDescriptions: true
```

### Excluding Doc Groups

Skip entire doc groups by name. Useful for pre-release or internal-only operations.

```yaml
extensions:
  graphql-docs:
    excludeDocGroups:
      - Internal
      - Experimental
```

You can also pass a single string (it will be normalized to an array).

### Sidebar Category Index Pages

Control whether clicking a sidebar category label navigates to an index page or just expands/collapses:

| Option                 | Type      | Default | Description                                                         |
| :--------------------- | :-------- | :------ | :------------------------------------------------------------------ |
| `sidebarCategoryIndex` | `boolean` | `false` | When true, generates a `generated-index` page for category headers. |

### Sidebar Section Labels

Customize the header labels shown above the operations and types sections:

```yaml
extensions:
  graphql-docs:
    sidebarSectionLabels:
      operations: Operations
      types: Types
```

### Intro Docs

Provide MD/MDX files that appear at the top of the API sidebar. The first doc becomes the landing page
for the API docs (via sidebar order).

```yaml
extensions:
  graphql-docs:
    introDocs:
      - ./docs/api-overview.mdx
      - source: ./docs/authentication.mdx
        label: Authentication
        outputPath: intro/authentication.mdx
```

Each entry can be either a string path or an object:

| Field        | Type     | Description                                       |
| :----------- | :------- | :------------------------------------------------ |
| `source`     | `string` | Path to the source `.md` or `.mdx` file.          |
| `outputPath` | `string` | Optional path under the output directory.         |
| `id`         | `string` | Optional frontmatter id (inserted if missing).    |
| `label`      | `string` | Optional sidebar label (inserted if missing).     |
| `title`      | `string` | Optional frontmatter title (inserted if missing). |

### Type Expansion Options

Control how nested types are expanded in the documentation:

| Option                                 | Type      | Default | Description                                                                                    |
| :------------------------------------- | :-------- | :------ | :--------------------------------------------------------------------------------------------- |
| `typeExpansion.maxDepth`               | `number`  | `5`     | Hard limit on inline expansion depth. Deeper references render as type links.                  |
| `typeExpansion.defaultLevels`          | `number`  | `0`     | Soft limit for UI expansion. Types beyond this depth are marked as collapsible                 |
| `typeExpansion.showCircularReferences` | `boolean` | `true`  | When true, circular references show a "(circular)" indicator. When false, shown as plain links |

## Example Configurations

### Using `.graphqlrc` (Recommended)

```yaml
schema: schema.graphql

extensions:
  graphql-docs:
    outputDir: ./docs/api
    framework: docusaurus
    metadataDir: ./docs-metadata
    includeDeprecated: true
    generateSidebar: true
    typeExpansion:
      maxDepth: 5
      defaultLevels: 0
```

### Using `graphql-docs.config.js`

```javascript
module.exports = {
  outputDir: './website/docs/api',
  framework: 'docusaurus',
  metadataDir: './docs-metadata',
  includeDeprecated: true,
  skipTypes: ['InternalType', 'DebugInfo'],
  generateSidebar: true,
  typeExpansion: {
    maxDepth: 5,
    defaultLevels: 0,
    showCircularReferences: true,
  },
};
```

### Minimal Configuration

```yaml
# .graphqlrc
schema: schema.graphql

extensions:
  graphql-docs:
    outputDir: ./docs/api
```

All other options will use their defaults.

## CLI Overrides

Some options can be overridden via CLI flags:

```bash
# Override output directory
graphql-docs generate -o ./custom-output

# Use a specific config file
graphql-docs generate -c ./config/graphql-docs.config.js
```

See the [CLI Reference](./cli.md) for all available options.
