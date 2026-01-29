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

| Option       | Type      | Default      | Description                                                |
| :----------- | :-------- | :----------- | :--------------------------------------------------------- |
| `outputDir`  | `string`  | `./docs/api` | Directory where generated documentation will be written    |
| `framework`  | `string`  | `docusaurus` | Output framework. Currently only `docusaurus` is supported |
| `singlePage` | `boolean` | `false`      | Generate a single page instead of multiple files           |

### Metadata Options

| Option        | Type     | Default                  | Description                                      |
| :------------ | :------- | :----------------------- | :----------------------------------------------- |
| `metadataDir` | `string` | `./docs-metadata`        | Base directory for examples and error metadata   |
| `examplesDir` | `string` | `{metadataDir}/examples` | Directory containing example JSON files          |
| `errorsDir`   | `string` | `{metadataDir}/errors`   | Directory containing error definition JSON files |

### Content Options

| Option              | Type       | Default | Description                                      |
| :------------------ | :--------- | :------ | :----------------------------------------------- |
| `includeDeprecated` | `boolean`  | `true`  | Include deprecated operations in documentation   |
| `skipTypes`         | `string[]` | `[]`    | List of type names to exclude from documentation |

### Sidebar Options

| Option            | Type      | Default | Description                                                                  |
| :---------------- | :-------- | :------ | :--------------------------------------------------------------------------- |
| `generateSidebar` | `boolean` | `true`  | Generate Docusaurus sidebar configuration                                    |
| `sidebarFile`     | `string`  | auto    | Custom filename for sidebar (defaults to `sidebars.js` or `sidebars.api.js`) |

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

### Type Expansion Options

Control how nested types are expanded in the documentation:

| Option                                 | Type      | Default | Description                                                                                    |
| :------------------------------------- | :-------- | :------ | :--------------------------------------------------------------------------------------------- |
| `typeExpansion.maxDepth`               | `number`  | `5`     | Hard limit on recursion depth. Types at this depth have empty fields                           |
| `typeExpansion.defaultLevels`          | `number`  | `2`     | Soft limit for UI expansion. Types beyond this depth are marked as collapsible                 |
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
      defaultLevels: 2
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
    defaultLevels: 2,
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
