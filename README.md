# GraphQL Operation-First Documentation Generator

An AI-forward GraphQL documentation generator that organizes docs by **operation** (queries and
mutations), emits model-friendly markdown, and ships with Docusaurus middleware for markdown-aware
agent access patterns.

## Documentation

- [Usage Guide](./docs/usage-guide.md)
- [CLI Reference](./docs/cli.md)
- [Configuration Guide](./docs/configuration.md)
- [Config Schema Autocomplete](./docs/config-schema.md)
- [LLM Docs Guide](./docs/llm-docs.md)
- [Agent Skills Guide](./docs/agent-skills.md)
- [Custom Directives](./docs/directives.md)
- [Migration Guide](./docs/migration-guide.md)
- [Components Guide](./docs/components.md)
- [Architecture Guide](./docs/architecture.md)
- [Contributing Guide](./CONTRIBUTING.md)

## Core Capabilities

- Operation-first docs generation from GraphQL schema + metadata.
- Docusaurus plugin runtime that generates docs during start/build.
- LLM markdown output (`llm-docs`) plus `llms.txt` manifest.
- Accept-markdown middleware for dev-server markdown negotiation.
- Docs source fallback that can return backing `.md`/`.mdx` for non-graphql-doc routes.
- Downloadable API skill artifact generation (`SKILL.md`, scripts, zip package).
- Multi-target generation for separate prod/lab docs outputs.

## Installation

```bash
npm install @lewl/graphql-doc
```

## Quick Start

### 1. Register the Docusaurus Plugin

```ts
// docusaurus.config.ts
plugins: [
  [
    require.resolve('@lewl/graphql-doc/docusaurus-plugin'),
    {
      configPath: './graphql-doc.config.json',
      // Optional: enable file watching in dev
      watch: true,

      // Enabled by default
      llmDocs: true,
      markdownRedirect: {
        enabled: true,
      },
    },
  ],
];
```

Keep this plugin before `@docusaurus/preset-classic` / docs content plugins so generated files exist
before docs loading.

### 2. Define Generator Config

```yaml
# .graphqlrc
schema: ./schema.graphql

extensions:
  graphql-doc:
    configVersion: 1
    outputDir: ./docs/api
    metadataDir: ./docs-metadata
    llmDocs:
      enabled: true
      outputDir: ./static/llm-docs
      strategy: chunked
      baseUrl: https://docs.example.com
```

### 3. Validate and Generate

```bash
npx graphql-doc validate --strict
npx graphql-doc generate --clean-output
```

## AI-Forward Docs Flow

### Downloadable markdown

With `llmDocs.outputDir: ./static/llm-docs`, generated markdown is directly retrievable:

- `/llm-docs/index.md`
- `/llm-docs/<group>.md`
- `/llms.txt`

### Accept-markdown middleware

With plugin defaults, markdown-aware requests in `docusaurus start` can return markdown for:

- GraphQL docs routes (`/docs/api/*` by default)
- Other docs routes with source metadata mapping (`/docs/*` by default)

Production static hosting still needs server/edge middleware for `Accept`-based negotiation.

### Downloadable API skill package

Enable skill artifacts:

```yaml
extensions:
  graphql-doc:
    agentSkill:
      enabled: true
      name: graphql-api-skill
      introDoc:
        enabled: true
```

This outputs installable skill files and a zip package for agent tooling.

## Multi-Target Example (Prod + Lab)

```yaml
extensions:
  graphql-doc:
    configVersion: 1
    targets:
      - name: main
        schema: ./graphql/api.graphql
        outputDir: ./docs/api
        llmDocs:
          enabled: true
          outputDir: ./static/llm-docs/main
      - name: lab
        schema:
          primary: ./graphql/api-lab.graphql
          fallback: ./graphql/api.graphql
        outputDir: ./versioned_docs/version-lab/api
        llmDocs:
          enabled: true
          outputDir: ./static/llm-docs/lab
```

When `targets[]` exists, default `generate` runs all enabled targets.

## Development

### Prerequisites

- Node.js >= 18
- npm

### Setup

```bash
npm install
npm run build
npm test
npm run test:e2e
npm run lint
npm run format
```

## License

MIT
