# Configuration Guide

The generator can be configured through:

- `.graphqlrc` (`extensions.graphql-docs`)
- `graphql-docs.config.js` / `.ts` / `.json`
- `.graphql-docsrc` / `.graphql-docsrc.json`

## Starter Configuration

Most projects only need these options:

| Option                           | Default           | Why it matters                                   |
| :------------------------------- | :---------------- | :----------------------------------------------- |
| `configVersion`                  | `1`               | Locks config behavior to a known schema version  |
| `outputDir`                      | `./docs/api`      | Where generated API docs are written             |
| `metadataDir`                    | `./docs-metadata` | Base directory for examples/metadata             |
| `exampleFiles` or `examplesDir`  | auto              | Where operation examples come from               |
| `cleanOutputDir`                 | `false`           | Whether old generated files are removed first    |
| `excludeDocGroups`               | `[]`              | Hide groups like `Internal` or `Experimental`    |
| `adapters.docusaurus.singlePage` | `false`           | Switch between multi-page and single-page output |

Starter `.graphqlrc`:

```yaml
schema: ./schema.graphql

extensions:
  graphql-docs:
    configVersion: 1
    outputDir: ./docs/api
    metadataDir: ./docs-metadata
    cleanOutputDir: true
    excludeDocGroups:
      - Internal
    adapters:
      docusaurus:
        singlePage: false
```

## Advanced Configuration

Use these when needed:

- `schemaExtensions`: merge framework scalar/directive stubs into the schema.
- `requireExamplesForDocumentedOperations`: fail generate/validate when documented operations have no examples.
- `typeExpansion.*`: tune expansion depth and collapsible behavior.
- `llmDocs.*`: emit LLM-friendly markdown + `llms.txt`.
- `agentSkill.*`: emit downloadable AI skill artifacts.
- `adapters.docusaurus.*`: sidebar generation, intro docs, type link behavior, unsafe MDX toggle.

## Core Options

| Option                                   | Type                 | Default                   |
| :--------------------------------------- | :------------------- | :------------------------ |
| `configVersion`                          | `1`                  | `1`                       |
| `outputDir`                              | `string`             | `./docs/api`              |
| `cleanOutputDir`                         | `boolean`            | `false`                   |
| `framework`                              | `string`             | `docusaurus`              |
| `metadataDir`                            | `string`             | `./docs-metadata`         |
| `examplesDir`                            | `string`             | `${metadataDir}/examples` |
| `exampleFiles`                           | `string \| string[]` |                           |
| `schemaExtensions`                       | `string[]`           | `[]`                      |
| `allowRemoteSchema`                      | `boolean`            | `false`                   |
| `excludeDocGroups`                       | `string \| string[]` | `[]`                      |
| `requireExamplesForDocumentedOperations` | `boolean`            | `false`                   |

`exampleFiles` accepts one or many files/globs:

```yaml
extensions:
  graphql-docs:
    exampleFiles:
      - ./docs-metadata/examples/queries/*.json
      - ./docs-metadata/examples/mutations/*.json
      - ./docs-metadata/examples/shared/common.json
```

## Type Expansion

| Option                                 | Default |
| :------------------------------------- | :------ |
| `typeExpansion.maxDepth`               | `5`     |
| `typeExpansion.defaultLevels`          | `0`     |
| `typeExpansion.showCircularReferences` | `true`  |

## Docusaurus Adapter Options

All Docusaurus-specific config lives under `adapters.docusaurus`.

| Option                                       | Default          |
| :------------------------------------------- | :--------------- |
| `adapters.docusaurus.singlePage`             | `false`          |
| `adapters.docusaurus.docsRoot`               | `./docs`         |
| `adapters.docusaurus.docIdPrefix`            | auto             |
| `adapters.docusaurus.unsafeMdxDescriptions`  | `false`          |
| `adapters.docusaurus.typeLinkMode`           | `none`           |
| `adapters.docusaurus.llmDocsBasePath`        | auto/empty       |
| `adapters.docusaurus.generateSidebar`        | `true`           |
| `adapters.docusaurus.sidebarFile`            | auto             |
| `adapters.docusaurus.sidebarMerge`           | `true`           |
| `adapters.docusaurus.sidebarTarget`          | `apiSidebar`     |
| `adapters.docusaurus.sidebarInsertPosition`  | `replace`        |
| `adapters.docusaurus.sidebarInsertReference` |                  |
| `adapters.docusaurus.sidebarCategoryIndex`   | `false`          |
| `adapters.docusaurus.sidebarSectionLabels`   | operations/types |
| `adapters.docusaurus.introDocs`              | `[]`             |

Intro docs are adapter-scoped:

```yaml
extensions:
  graphql-docs:
    adapters:
      docusaurus:
        introDocs:
          - ./docs/api-overview.mdx
          - source: ./docs/authentication.mdx
            outputPath: intro/authentication.mdx
            label: Authentication
          - content: |
              # API Changelog
            outputPath: intro/changelog.mdx
            label: Changelog
```

Each entry can be:

- `string`: source path.
- `object`: `{ source | content, outputPath?, id?, label?, title? }`

## LLM Docs Options

| Option                     | Default            |
| :------------------------- | :----------------- |
| `llmDocs.enabled`          | `true`             |
| `llmDocs.outputDir`        | `llm-docs`         |
| `llmDocs.strategy`         | `chunked`          |
| `llmDocs.includeExamples`  | `true`             |
| `llmDocs.generateManifest` | `true`             |
| `llmDocs.singleFileName`   | `api-reference.md` |
| `llmDocs.maxTypeDepth`     | `3`                |
| `llmDocs.baseUrl`          |                    |
| `llmDocs.apiName`          |                    |
| `llmDocs.apiDescription`   |                    |

## Agent Skill Options

| Option                              | Default                    |
| :---------------------------------- | :------------------------- |
| `agentSkill.enabled`                | `false`                    |
| `agentSkill.name`                   | `graphql-api-skill`        |
| `agentSkill.description`            |                            |
| `agentSkill.outputDir`              | auto                       |
| `agentSkill.includeExamples`        | `true`                     |
| `agentSkill.pythonScriptName`       | `graphql_docs_skill.py`    |
| `agentSkill.introDoc.enabled`       | `true`                     |
| `agentSkill.introDoc.outputPath`    | `intro/ai-agent-skill.mdx` |
| `agentSkill.introDoc.id`            |                            |
| `agentSkill.introDoc.label`         | `AI Agent Skill`           |
| `agentSkill.introDoc.title`         | `AI Agent Skill`           |
| `agentSkill.introDoc.description`   |                            |
| `agentSkill.introDoc.downloadUrl`   | auto                       |
| `agentSkill.introDoc.downloadLabel` | auto                       |

## Unsafe MDX Descriptions

`adapters.docusaurus.unsafeMdxDescriptions: true` renders schema descriptions as raw MDX.
Only enable this for trusted, author-controlled schema content.

## Config Versioning and Migration

- `configVersion` defaults to `1`.
- Legacy root-level Docusaurus keys are migrated to `adapters.docusaurus.*` with warnings.
- Legacy root-level `introDocs` is migrated to `adapters.docusaurus.introDocs` with warnings.

See `docs/migration-guide.md` for migration examples.

## IDE Autocomplete

The JSON schema is published at `src/schemas/config-schema.json`.

See `docs/config-schema.md` for editor setup snippets.
