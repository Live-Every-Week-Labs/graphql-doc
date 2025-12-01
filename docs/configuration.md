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
