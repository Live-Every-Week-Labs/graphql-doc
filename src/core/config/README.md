# Config System

The `src/core/config` module handles configuration loading and validation for the generator.

## Core Components

### 1. Config Schema

**File:** `schema.ts`

- Defines the configuration structure using **Zod**.
- Sets default values for optional fields.
- **Key Options:**
  - `configVersion`: Config schema version used for migration/compat checks (default: `1`).
  - `outputDir`: Where to generate docs (default: `./docs/api`).
  - `cleanOutputDir`: Remove existing files in `outputDir` before generation (default: `false`).
  - `framework`: Adapter key to use (default: `docusaurus`).
  - `metadataDir`: Path to external metadata (default: `./docs-metadata`).
  - `examplesDir`: Path to examples (default: `${metadataDir}/examples`).
  - `exampleFiles`: Explicit example file paths/globs (string or array). Overrides `examplesDir` lookup.
  - `schemaExtensions`: Extra SDL files merged into the schema for framework scalars/directives (default: `[]`).
  - `allowRemoteSchema`: Allow loading schema from remote URLs (default: `false`).
  - `excludeDocGroups`: Doc group names to exclude from output (string or array, default: `[]`).
  - `requireExamplesForDocumentedOperations`: Fail generation/validation when documented operations have no examples (default: `false`).
  - `typeExpansion`: Settings for type depth and circular references.
    - `maxDepth`: Hard limit on inline expansion depth (default: `5`). Deeper references render as type links.
    - `defaultLevels`: Soft limit for UI expansion (default: `0`). Types beyond this depth are marked as collapsible.
    - `showCircularReferences`: Show circular reference indicators (default: `true`).
  - `llmDocs`: LLM-optimized Markdown output settings.
    - `enabled`, `outputDir`, `strategy`, `includeExamples`, `generateManifest`
    - `singleFileName`, `maxTypeDepth`, `baseUrl`, `apiName`, `apiDescription`
  - `agentSkill`: AI skill artifact generation settings.
    - `enabled`, `name`, `description`, `outputDir`, `includeExamples`, `pythonScriptName`
    - `introDoc.enabled`, `introDoc.outputPath`, `introDoc.id`, `introDoc.title`, `introDoc.description`, `introDoc.downloadUrl`, `introDoc.downloadLabel`
  - `adapters.docusaurus`: Docusaurus-only options, including:
    - `singlePage`, `docsRoot`, `docIdPrefix`, `unsafeMdxDescriptions`, `typeLinkMode`
    - Sidebar controls (`generateSidebar`, `sidebar*`)
    - `introDocs` for Docusaurus intro/landing pages

### 2. Config Loader

**File:** `loader.ts`

- Responsible for finding and parsing the configuration.
- **Loading Priority:**
  1.  **GraphQL Config (`.graphqlrc`):** Checks for a `graphql-doc` extension block.
      - _Note:_ Logs a warning if loading fails (e.g., file not found) and proceeds to next method.
  2.  **Cosmiconfig:** Searches for `graphql-doc.config.js`, `.json`, etc.
  3.  **Defaults:** Falls back to default values defined in the Zod schema.

- **Smart Defaults:**
  - If `exampleFiles` is not set and `examplesDir` is not explicitly provided, it automatically defaults to a subdirectory within the configured `metadataDir`.
  - Example: If `metadataDir` is `./api-data`, examples will be looked for in `./api-data/examples`.
  - Legacy Docusaurus keys (e.g. `singlePage`, `sidebar*`) are mapped into `adapters.docusaurus`.
  - Legacy root `introDocs` is migrated to `adapters.docusaurus.introDocs`.
  - Missing `configVersion` is auto-migrated to the current version with warnings.

- **Path Resolution Helper:**
  - `resolveConfigPaths` normalizes relative paths (output, metadata, examples, explicit example files, schema extensions, LLM docs output, adapter intro docs, and agent skill output) against a root directory.

### 3. Schema Pointer Resolution

**File:** `schema-pointer.ts`

- Centralizes schema pointer discovery shared by CLI and plugin runtime.
- Exposes:
  - `resolveSchemaPointer`: resolves in priority order (explicit option -> `.graphqlrc` -> `schema.graphql`).
  - `resolveSchemaPointers`: resolves local pointer paths relative to target root.

## Usage

```typescript
import { loadGeneratorConfig, resolveConfigPaths } from './core/config/loader';

const config = resolveConfigPaths(await loadGeneratorConfig(), process.cwd());
console.log(config.outputDir);
```
