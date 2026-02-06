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

| Option              | Type       | Default      | Description                                                            |
| :------------------ | :--------- | :----------- | :--------------------------------------------------------------------- |
| `outputDir`         | `string`   | `./docs/api` | Directory where generated documentation will be written                |
| `cleanOutputDir`    | `boolean`  | `false`      | Remove existing files in `outputDir` before writing new generated docs |
| `framework`         | `string`   | `docusaurus` | Adapter key to use (currently only `docusaurus` is supported)          |
| `schemaExtensions`  | `string[]` | `[]`         | Extra SDL files merged into the schema (framework scalars/directives)  |
| `allowRemoteSchema` | `boolean`  | `false`      | Allow loading schemas from remote URLs (http/https)                    |

Set `cleanOutputDir: true` when `outputDir` is dedicated to generated docs. Keep it `false` if the
directory also contains hand-written files you want to preserve.

### Metadata Options

| Option         | Type                 | Default                  | Description                                                            |
| :------------- | :------------------- | :----------------------- | :--------------------------------------------------------------------- |
| `metadataDir`  | `string`             | `./docs-metadata`        | Base directory for example metadata                                    |
| `examplesDir`  | `string`             | `{metadataDir}/examples` | Directory containing example JSON files when `exampleFiles` is not set |
| `exampleFiles` | `string \| string[]` |                          | One or more JSON file paths or glob patterns for examples              |

### Example Source Configuration

Use `examplesDir` when your examples live in a single directory tree. Use `exampleFiles` when you
want explicit files, multiple directories, or mixed glob patterns.

```yaml
extensions:
  graphql-docs:
    exampleFiles:
      - ./docs-metadata/examples/queries/*.json
      - ./docs-metadata/examples/mutations/*.json
      - ./docs-metadata/examples/shared/common.json
```

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

| Option                                   | Type                 | Default | Description                                      |
| :--------------------------------------- | :------------------- | :------ | :----------------------------------------------- |
| `includeDeprecated`                      | `boolean`            | `true`  | Include deprecated operations in documentation   |
| `skipTypes`                              | `string[]`           | `[]`    | List of type names to exclude from documentation |
| `excludeDocGroups`                       | `string \| string[]` | `[]`    | Doc group names to exclude from generated docs   |
| `requireExamplesForDocumentedOperations` | `boolean`            | `false` | Fail when a documented operation has no examples |
| `typeExpansion`                          | `object`             | `{}`    | Settings for type expansion depth and behavior   |

### LLM Docs Options

LLM docs generation produces raw Markdown optimized for LLM ingestion. For Docusaurus, set
`llmDocs.outputDir` to `./static/llm-docs` so the files are served as raw Markdown (no HTML).
The generator writes `llms.txt` alongside the `llm-docs` folder (e.g., `./static/llms.txt`).

| Option                     | Type                | Default            | Description                                        |
| :------------------------- | :------------------ | :----------------- | :------------------------------------------------- |
| `llmDocs.enabled`          | `boolean`           | `true`             | Enable/disable LLM docs generation                 |
| `llmDocs.outputDir`        | `string`            | `llm-docs`         | Output directory for raw Markdown files            |
| `llmDocs.strategy`         | `single \| chunked` | `chunked`          | Generate a single file or one file per `@docGroup` |
| `llmDocs.includeExamples`  | `boolean`           | `true`             | Include example queries/responses when available   |
| `llmDocs.generateManifest` | `boolean`           | `true`             | Generate `llms.txt` at the output root             |
| `llmDocs.singleFileName`   | `string`            | `api-reference.md` | Filename for single-file strategy                  |
| `llmDocs.maxTypeDepth`     | `1-5`               | `3`                | Maximum nested type expansion depth                |
| `llmDocs.baseUrl`          | `string`            |                    | Base URL used for absolute links in `llms.txt`     |
| `llmDocs.apiName`          | `string`            |                    | API name/title used in headers and manifests       |
| `llmDocs.apiDescription`   | `string`            |                    | API description used in `index.md` and `llms.txt`  |

### Docusaurus Adapter Options

Adapter-specific settings live under `adapters.<framework>`. For Docusaurus, use `adapters.docusaurus`.

| Option                                      | Type      | Default  | Description                                                   |
| :------------------------------------------ | :-------- | :------- | :------------------------------------------------------------ |
| `adapters.docusaurus.singlePage`            | `boolean` | `false`  | Generate a single page instead of multiple files              |
| `adapters.docusaurus.docsRoot`              | `string`  | `./docs` | Docusaurus docs root used for sidebar doc id prefixing        |
| `adapters.docusaurus.docIdPrefix`           | `string`  |          | Override doc id prefix for sidebars (e.g. `api`)              |
| `adapters.docusaurus.unsafeMdxDescriptions` | `boolean` | `false`  | Render schema descriptions as raw MDX (unsafe by default)     |
| `adapters.docusaurus.typeLinkMode`          | `string`  | `none`   | Controls when type names render as links                      |
| `adapters.docusaurus.llmDocsBasePath`       | `string`  |          | Base path for LLM Markdown download button (e.g. `/llm-docs`) |
| `adapters.docusaurus.generateSidebar`       | `boolean` | `true`   | Generate Docusaurus sidebar configuration                     |

### Docusaurus Sidebar Options

| Option                                       | Type      | Default            | Description                                                                               |
| :------------------------------------------- | :-------- | :----------------- | :---------------------------------------------------------------------------------------- |
| `adapters.docusaurus.sidebarFile`            | `string`  | auto               | Custom sidebar path. `.api.js` writes an array export; otherwise merges/exports an object |
| `adapters.docusaurus.sidebarMerge`           | `boolean` | `true`             | Merge into an existing sidebar file when present                                          |
| `adapters.docusaurus.sidebarTarget`          | `string`  | `apiSidebar`       | Sidebar key to update when merging                                                        |
| `adapters.docusaurus.sidebarInsertPosition`  | `string`  | `replace`          | How to insert items (`replace`, `append`, `prepend`, `before`, `after`)                   |
| `adapters.docusaurus.sidebarInsertReference` | `string`  |                    | Label/id/value to insert before/after when using `before`/`after`                         |
| `adapters.docusaurus.sidebarCategoryIndex`   | `boolean` | `false`            | When true, category labels link to a generated index page                                 |
| `adapters.docusaurus.introDocs`              | `array`   | `[]`               | MD/MDX docs to prepend to the API sidebar                                                 |
| `adapters.docusaurus.sidebarSectionLabels`   | `object`  | `Operations/Types` | Labels for sidebar section headers (operations/types)                                     |

When `adapters.docusaurus.sidebarMerge` is enabled and the target sidebar file exists, the
generator appends a small injection block that updates the target key
(`adapters.docusaurus.sidebarTarget`). This preserves any other sidebars in the file and lets you
control placement with `adapters.docusaurus.sidebarInsertPosition`.

For `before`/`after`, the generator searches for a matching item by `label`, `id`, or `value`.
If no match is found, it falls back to appending.

If `adapters.docusaurus.sidebarFile` ends with `.api.js`, the generator writes a standalone array
export and skips merging. This is useful when you want to import the generated sidebar into another
file.

If you want to target a sidebar outside the output directory, pass an absolute
`adapters.docusaurus.sidebarFile` path.

If your `outputDir` lives under the Docusaurus docs root (default `./docs`), the generator will
automatically prefix sidebar document ids (for example, `api/...` when `outputDir` is `./docs/api`).
Override this with `adapters.docusaurus.docIdPrefix` if your docs root is different.

### Single-Page Mode

When `adapters.docusaurus.singlePage: true` is set, the generator produces a single
`api-reference.mdx` file instead of multiple files per operation. This mode includes:

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
    adapters:
      docusaurus:
        singlePage: true
```

### External Data Mode

The generator always writes shared JSON data files (e.g. `_data/operations.json` and `_data/types.json`).
MDX files import those shared maps instead of embedding the full JSON payload inline. This keeps
individual MDX files small and avoids repeating the same definitions across files.

### Type Link Mode

Control whether type names render as clickable links in generated docs:

| Option                             | Type     | Default | Description                                   |
| :--------------------------------- | :------- | :------ | :-------------------------------------------- |
| `adapters.docusaurus.typeLinkMode` | `string` | `none`  | `none`, `deep`, or `all` (see details below). |

- `none`: No type name links (default).
- `deep`: Only link type names when inline expansion is no longer possible.
- `all`: Link all type name references.

### Unsafe MDX Descriptions

By default, schema descriptions are rendered as plain text to avoid MDX injection risks.
If your schema descriptions are trusted and you want to render them as raw MDX, set:

```yaml
extensions:
  graphql-docs:
    adapters:
      docusaurus:
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

### Required Example Coverage

Enable `requireExamplesForDocumentedOperations` to fail `generate` and `validate` when an
operation that will be included in docs has no examples. Operations hidden via `@docIgnore` and
groups excluded by `excludeDocGroups` are ignored by this check.

```yaml
extensions:
  graphql-docs:
    requireExamplesForDocumentedOperations: true
```

### Sidebar Category Index Pages

Control whether clicking a sidebar category label navigates to an index page or just expands/collapses:

| Option                                     | Type      | Default | Description                                                         |
| :----------------------------------------- | :-------- | :------ | :------------------------------------------------------------------ |
| `adapters.docusaurus.sidebarCategoryIndex` | `boolean` | `false` | When true, generates a `generated-index` page for category headers. |

### Sidebar Section Labels

Customize the header labels shown above the operations and types sections:

```yaml
extensions:
  graphql-docs:
    adapters:
      docusaurus:
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
    adapters:
      docusaurus:
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
    adapters:
      docusaurus:
        generateSidebar: true
    llmDocs:
      outputDir: ./static/llm-docs
      baseUrl: https://docs.example.com
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
  adapters: {
    docusaurus: {
      generateSidebar: true,
    },
  },
  llmDocs: {
    outputDir: './static/llm-docs',
    baseUrl: 'https://docs.example.com',
  },
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
