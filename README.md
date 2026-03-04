# GraphQL Operation-First Documentation Generator

A documentation generator for GraphQL APIs that organizes content by **operation** (queries and mutations) rather than types. Designed to produce beautiful, task-oriented documentation for Docusaurus.

## Documentation

- [Usage Guide](./docs/usage-guide.md)
- [CLI Reference](./docs/cli.md)
- [Configuration Guide](./docs/configuration.md)
- [Config Schema Autocomplete](./docs/config-schema.md)
- [Migration Guide](./docs/migration-guide.md)
- [Custom Directives](./docs/directives.md)
- [LLM Docs Guide](./docs/llm-docs.md)
- [Agent Skills Guide](./docs/agent-skills.md)
- [Components Guide](./docs/components.md)
- [Architecture Guide](./docs/architecture.md)
- [Contributing Guide](./CONTRIBUTING.md)

## Features

- **Operation-First**: Documentation is organized by operations (queries, mutations) rather than types.
- 🧩 **Docusaurus Integration**: Generates MDX files compatible with Docusaurus sidebars.
- 🤖 **LLM-Optimized Markdown**: Generate raw, token-efficient docs and `llms.txt` for AI assistants.
- 🔍 **Custom Directives**: Use `@docGroup`, `@docPriority`, and `@docTags` to organize your schema.
- 📄 **External Metadata**: Keep your schema clean by loading examples from external JSON files.
- 🗂️ **Flexible Example Sources**: Load examples from one or many JSON files/glob patterns.
- 🧪 **Example Coverage Guardrail**: Optionally fail builds when documented operations are missing examples.
- 🧱 **Shared Data Mode**: Generates shared JSON maps for operations/types to avoid repeated inline payloads.
- 📚 **Intro Docs**: Prepend MD/MDX docs to the API sidebar as a landing section.
- 🤖 **AI Skill Artifacts**: Optionally generate `SKILL.md` + helper script and an intro page with download links.
- 🧭 **Sidebar Controls**: Configurable category index pages and section header labels.
- 🎯 **Multi-Target Builds**: Generate separate prod/lab outputs and sidebars from one config.
- 🔗 **Type Link Modes**: Control when type names render as links (`none`, `deep`, `all`).
- 🧩 **Single-Page Mode**: Generate a single MDX file with hash-based navigation.
- ✅ **Validation**: Validate schema + metadata without generating docs.
- 🚫 **Group Exclusions**: Exclude doc groups from output via configuration.
- 🙈 **Selective Exclusions**: Hide operations, fields, arguments, enum values, or types with `@docIgnore`.
- 🛠️ **Configurable**: Supports `.graphqlrc`, `graphql-doc.config.js`, and more.
- 🎨 **Themable**: Full CSS variables support for easy customization and dark mode integration.

## Installation

```bash
npm install @lewl/graphql-doc
```

## Quick Start

### 1. Configure as a Docusaurus Plugin (Recommended)

Add the published plugin entry in your `docusaurus.config.ts`:

```ts
plugins: [
  [
    // Keep graphql-doc before preset-classic/content-docs declarations.
    require.resolve('@lewl/graphql-doc/docusaurus-plugin'),
    {
      configPath: './graphql-doc.config.json',
      schema: './schema.graphql',
      outputDir: './docs/api',
      // LLM markdown generation is enabled by default
      llmDocs: true,
      // Markdown redirect middleware is enabled by default
      markdownRedirect: {
        enabled: true,
      },
    },
  ],
];
```

On `docusaurus start` or `docusaurus build`, the plugin runs one generation pass before docs
content loading.

### 2. Initialize a Project

```bash
# Interactive setup
npx graphql-doc init

# Or use defaults
npx graphql-doc init --yes
```

This creates:

- `.graphqlrc` - Configuration file
- `docs-metadata/` - Sample metadata files
- `graphql-doc-directives.graphql` - Directive definitions for your schema

> **Important for AppSync/Production:** You must include `graphql-doc-directives.graphql` in your schema before deploying to production. See the [Directive Setup Guide](./docs/directives-setup.md) for instructions.

### 3. Generate Documentation (CLI Workflow)

```bash
npx graphql-doc generate -s schema.graphql -o docs/api
```

For more details, see the [CLI Reference](./docs/cli.md).

### Configuration

Create a `.graphqlrc` or `graphql-doc.config.js` file in your project root:

```yaml
# .graphqlrc
schema: './schema.graphql'
extensions:
  graphql-doc:
    configVersion: 1
    outputDir: './docs/api'
    framework: 'docusaurus'
    metadataDir: './docs-metadata'
    adapters:
      docusaurus:
        introDocs:
          - ./docs/api-overview.mdx
```

`agentSkill.enabled` is opt-in and remains disabled unless you explicitly enable it.

### Multi-Target Example (Prod + Lab)

```yaml
extensions:
  graphql-doc:
    configVersion: 1
    targets:
      - name: main
        schema: ./graphql/api.graphql
        outputDir: ./docs/api
      - name: lab
        schema:
          primary: ./graphql/api-lab.graphql
          fallback: ./graphql/api.graphql
        outputDir: ./versioned_docs/version-lab/api
```

Then run:

```bash
npx graphql-doc generate -c graphql-doc.config.json
```

When `targets[]` is configured, the default `generate` run executes all enabled targets.

## Adapter Isolation

All Docusaurus-specific runtime behavior is isolated in the adapter layer:
`src/core/adapters/docusaurus/**`.

## Development

### Prerequisites

- Node.js >= 18
- npm

### Setup

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test
npm run test:e2e

# Lint and format
npm run lint
npm run format
```

## License

MIT
