# Migration Guide

This guide covers legacy config migrations to `configVersion: 1`.

## Add `configVersion`

Set:

```yaml
extensions:
  graphql-doc:
    configVersion: 1
```

If missing, the loader migrates behavior and logs a warning.

## Move Legacy Docusaurus Keys

Legacy root-level Docusaurus keys are deprecated.

Before:

```yaml
extensions:
  graphql-doc:
    singlePage: true
    sidebarTarget: apiSidebar
```

After:

```yaml
extensions:
  graphql-doc:
    adapters:
      docusaurus:
        singlePage: true
        sidebarTarget: apiSidebar
```

## Move Root `introDocs`

Root-level `introDocs` is migrated to `adapters.docusaurus.introDocs`.

Before:

```yaml
extensions:
  graphql-doc:
    introDocs:
      - ./docs/overview.mdx
```

After:

```yaml
extensions:
  graphql-doc:
    adapters:
      docusaurus:
        introDocs:
          - ./docs/overview.mdx
```

## Validation Changes

- Unknown future `configVersion` values fail fast.
- Invalid version values (negative/non-integer) fail validation.
