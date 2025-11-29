# Configuration Guide

The generator can be configured via CLI arguments or a configuration file.

## Configuration File

Supported formats: `.json`, `.yaml`, `.js`, `.ts`.
The generator uses `cosmiconfig` to search for configuration files (e.g., `.graphql-docsrc`, `graphql-docs.config.js`).

### Options

| Option       | Type      | Default          | Description                                                            |
| :----------- | :-------- | :--------------- | :--------------------------------------------------------------------- |
| `schema`     | `string`  | `schema.graphql` | Path to the GraphQL schema file or URL.                                |
| `output`     | `string`  | `docs`           | Directory where the generated documentation will be written.           |
| `adapter`    | `string`  | `docusaurus`     | Output adapter to use. Currently only `docusaurus` is supported.       |
| `singlePage` | `boolean` | `false`          | If `true`, generates a single markdown file instead of multiple files. |

### Example `graphql-docs.config.js`

```javascript
module.exports = {
  schema: './src/schema.graphql',
  output: './website/docs/api',
  adapter: 'docusaurus',
  singlePage: false,
};
```
