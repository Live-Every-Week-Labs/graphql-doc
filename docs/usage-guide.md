# Usage Guide

This package is an AI-forward GraphQL docs generator built for Docusaurus. It generates
human-friendly operation docs and machine-friendly markdown artifacts from the same schema and
metadata source.

## Installation

```bash
npm install --save-dev @lewl/graphql-doc
```

## Recommended Workflow (Docusaurus Plugin)

Use the published plugin so docs generation runs during `docusaurus start` and `docusaurus build`.

```ts
// docusaurus.config.ts
plugins: [
  [
    require.resolve('@lewl/graphql-doc/docusaurus-plugin'),
    {
      configPath: './graphql-doc.config.json',
      // Optional runtime overrides:
      // schema: './schema.graphql',
      // outputDir: './docs/api',

      // Enable file watching in dev (off by default)
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

Plugin behavior:

- Generates GraphQL docs before docs content loading.
- Injects graphql-doc UI styles and theme wrappers.
- Optionally watches schema/config/metadata paths when `watch: true`.
- Exposes generation metadata through plugin global data.

## Core Generator Config

Minimal `.graphqlrc`:

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

For full option reference, see [Configuration Guide](./configuration.md).

## AI-Forward Output Model

### 1. Downloadable LLM Markdown

With `llmDocs.enabled: true`, the generator emits markdown artifacts intended for agent ingestion
and offline/downloaded use. In Docusaurus, `./static/llm-docs` is the recommended output location.

See [LLM Docs Guide](./llm-docs.md) for strategy/output details.

### 2. Accept Markdown Middleware (Development)

With plugin `markdownRedirect.enabled: true` (default), markdown-aware requests can receive markdown
instead of HTML during `docusaurus start`.

Resolution order:

1. GraphQL API routes (default `/docs/api/*`) -> generated LLM markdown.
2. Other docs routes (default `/docs/*`) -> backing `.md`/`.mdx` source file when metadata maps the route.

Detection supports:

- `Accept: text/markdown`
- `Accept: text/x-markdown`
- Alias headers such as `x-doc-format: md`

Production note: this middleware is dev-server behavior. For deployed static hosting, add
server/edge middleware if you need `Accept`-based markdown negotiation in production.

See [Configuration Guide](./configuration.md#docusaurus-plugin-runtime-options) for all middleware
and request-detection options.

### 3. Downloadable API Skill Artifact

When `agentSkill.enabled: true`, graphql-doc generates a zipped skill package plus optional intro
doc content with a download action.

```yaml
extensions:
  graphql-doc:
    agentSkill:
      enabled: true
      name: graphql-api-skill
      introDoc:
        enabled: true
        outputPath: intro/ai-agent-skill.mdx
        title: AI Agent Skill
```

See [Agent Skills Guide](./agent-skills.md) for artifact layout and platform-specific setup links.

## CLI Workflow

Use CLI when you want explicit local generation or CI control:

```bash
# Initialize starter config + metadata structure
npx graphql-doc init --yes

# Validate schema/examples (recommended in CI)
npx graphql-doc validate --strict

# Generate docs
npx graphql-doc generate --clean-output
```

See [CLI Reference](./cli.md) for full command/flag documentation.

## Multi-Target Generation (Prod + Labs)

Use `targets[]` to generate isolated docs trees from separate schema sources.

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
        llmDocs:
          enabled: true
          outputDir: ./static/llm-docs/lab
```

Rules:

- `targets[].enabled` defaults to `true`.
- Default generate run executes all enabled targets.
- Use `--target <name>` to run one target.
- Set unique `llmDocs.outputDir` values per target.

See [Configuration Guide](./configuration.md#multi-target-generation-prod--lab) and
[CLI Reference](./cli.md#generate) for target selection and advanced behavior.

## Migration Notes (From Custom Scripts/Middleware)

If you previously stitched generation together manually:

1. Remove prebuild scripts that run `graphql-doc generate` separately.
2. Remove local markdown redirect middleware for docs markdown negotiation.
3. Remove manual graphql-doc CSS/theme wrapper re-exports if they only mirror package defaults.
4. Keep your existing `.graphqlrc`/`graphql-doc.config.*`, then point plugin `configPath` to it.

## Related Docs

- [Configuration Guide](./configuration.md)
- [LLM Docs Guide](./llm-docs.md)
- [Agent Skills Guide](./agent-skills.md)
- [Directives Guide](./directives.md)
