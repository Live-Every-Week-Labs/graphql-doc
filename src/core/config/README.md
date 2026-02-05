# Config System

The `src/core/config` module handles configuration loading and validation for the generator.

## Core Components

### 1. Config Schema

**File:** `schema.ts`

- Defines the configuration structure using **Zod**.
- Sets default values for optional fields.
- **Key Options:**
  - `outputDir`: Where to generate docs (default: `./docs/api`).
  - `framework`: Adapter key to use (default: `docusaurus`).
  - `metadataDir`: Path to external metadata (default: `./docs-metadata`).
  - `examplesDir`: Path to examples (default: `${metadataDir}/examples`).
  - `schemaExtensions`: Extra SDL files merged into the schema for framework scalars/directives (default: `[]`).
  - `allowRemoteSchema`: Allow loading schema from remote URLs (default: `false`).
  - `excludeDocGroups`: Doc group names to exclude from output (string or array, default: `[]`).
  - `typeExpansion`: Settings for type depth and circular references.
    - `maxDepth`: Hard limit on inline expansion depth (default: `5`). Deeper references render as type links.
    - `defaultLevels`: Soft limit for UI expansion (default: `0`). Types beyond this depth are marked as collapsible.
    - `showCircularReferences`: Show circular reference indicators (default: `true`).
  - `llmDocs`: LLM-optimized Markdown output settings.
    - `enabled`, `outputDir`, `strategy`, `includeExamples`, `generateManifest`
    - `singleFileName`, `maxTypeDepth`, `baseUrl`, `apiName`, `apiDescription`
  - `adapters.docusaurus`: Docusaurus-only options, including:
    - `singlePage`, `docsRoot`, `docIdPrefix`, `unsafeMdxDescriptions`, `typeLinkMode`
    - Sidebar controls (`generateSidebar`, `sidebar*`) and `introDocs`

### 2. Config Loader

**File:** `loader.ts`

- Responsible for finding and parsing the configuration.
- **Loading Priority:**
  1.  **GraphQL Config (`.graphqlrc`):** Checks for a `graphql-docs` extension block.
      - _Note:_ Logs a warning if loading fails (e.g., file not found) and proceeds to next method.
  2.  **Cosmiconfig:** Searches for `graphql-docs.config.js`, `.json`, etc.
  3.  **Defaults:** Falls back to default values defined in the Zod schema.

- **Smart Defaults:**
  - If `examplesDir` is not explicitly provided, it automatically defaults to a subdirectory within the configured `metadataDir`.
  - Example: If `metadataDir` is `./api-data`, examples will be looked for in `./api-data/examples`.
  - Legacy Docusaurus keys (e.g. `singlePage`, `sidebar*`) are mapped into `adapters.docusaurus`.

- **Path Resolution Helper:**
  - `resolveConfigPaths` normalizes relative paths (output, metadata, schema extensions, LLM docs output, and Docusaurus intro docs) against a root directory.

## Usage

```typescript
import { loadGeneratorConfig, resolveConfigPaths } from './core/config/loader';

const config = resolveConfigPaths(await loadGeneratorConfig(), process.cwd());
console.log(config.outputDir);
```
