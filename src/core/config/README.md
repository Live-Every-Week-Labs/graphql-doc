# Config System

The `src/core/config` module handles configuration loading and validation for the generator.

## Core Components

### 1. Config Schema

**File:** `schema.ts`

- Defines the configuration structure using **Zod**.
- Sets default values for optional fields.
- **Key Options:**
  - `outputDir`: Where to generate docs (default: `./docs/api`).
  - `framework`: Output format (default: `docusaurus`).
  - `singlePage`: Toggle single-page vs multi-page (default: `false`).
  - `metadataDir`: Path to external metadata (default: `./docs-metadata`).
  - `examplesDir`: Path to examples (default: `${metadataDir}/examples`).
  - `errorsDir`: Path to error definitions (default: `${metadataDir}/errors`).
  - `typeLinkMode`: Controls type name links (`none`, `deep`, `all`, default: `none`).
  - `typeExpansion`: Settings for type depth and circular references.
    - `maxDepth`: Hard limit on recursion depth (default: `5`). Types at this depth have empty fields.
    - `defaultLevels`: Soft limit for UI expansion (default: `2`). Types beyond this depth are marked as collapsible.
    - `showCircularReferences`: Show circular reference indicators (default: `true`).

### 2. Config Loader

**File:** `loader.ts`

- Responsible for finding and parsing the configuration.
- **Loading Priority:**
  1.  **GraphQL Config (`.graphqlrc`):** Checks for a `graphql-docs` extension block.
      - _Note:_ Logs a warning if loading fails (e.g., file not found) and proceeds to next method.
  2.  **Cosmiconfig:** Searches for `graphql-docs.config.js`, `.json`, etc.
  3.  **Defaults:** Falls back to default values defined in the Zod schema.

- **Smart Defaults:**
  - If `examplesDir` or `errorsDir` are not explicitly provided, they automatically default to subdirectories within the configured `metadataDir`.
  - Example: If `metadataDir` is `./api-data`, examples will be looked for in `./api-data/examples`.

## Usage

```typescript
import { loadGeneratorConfig } from './core/config/loader';

const config = await loadGeneratorConfig();
console.log(config.outputDir);
```
