# Config Schema and IDE Autocomplete

The config JSON schema is generated from Zod and stored at:

- `src/schemas/config-schema.json`

Regenerate it after config schema changes:

```bash
npm run generate:schema
```

## JSON Config Example

If you use `graphql-doc.config.json`, add `$schema`:

```json
{
  "$schema": "./node_modules/@lewl/graphql-doc/src/schemas/config-schema.json",
  "configVersion": 1,
  "outputDir": "./docs/api",
  "framework": "docusaurus",
  "groupOrdering": {
    "mode": "pinned",
    "pinToEnd": ["Deprecated"]
  }
}
```

If your project layout differs, point `$schema` to the copied/generated schema path that matches your build output.

## Multi-Target JSON Example

Use `targets` to generate isolated prod/lab docs from one config.

```json
{
  "$schema": "./node_modules/@lewl/graphql-doc/src/schemas/config-schema.json",
  "configVersion": 1,
  "outputDir": "./docs/api",
  "framework": "docusaurus",
  "targets": [
    {
      "name": "main",
      "schema": "./graphql/api.graphql",
      "outputDir": "./docs/api",
      "adapters": {
        "docusaurus": {
          "sidebarFile": "../../sidebars.js",
          "sidebarTarget": "apiSidebar",
          "sidebarMerge": true
        }
      }
    },
    {
      "name": "lab",
      "schema": {
        "primary": "./graphql/api-lab.graphql",
        "fallback": "./graphql/api.graphql"
      },
      "outputDir": "./versioned_docs/version-lab/api",
      "adapters": {
        "docusaurus": {
          "docIdPrefix": "api",
          "sidebarFile": "../../../versioned_sidebars/version-lab-sidebars.json",
          "sidebarTarget": "apiSidebar",
          "sidebarMerge": true
        }
      }
    }
  ]
}
```

## Notes

- The schema file is generated; do not edit manually.
- `configVersion` is validated and used for migration warnings.
