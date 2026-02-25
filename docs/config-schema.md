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
  "framework": "docusaurus"
}
```

If your project layout differs, point `$schema` to the copied/generated schema path that matches your build output.

## Notes

- The schema file is generated; do not edit manually.
- `configVersion` is validated and used for migration warnings.
