# LLM Docs Guide

LLM docs are markdown outputs optimized for retrieval, downloading, and agent context injection.

## What Gets Generated

When `llmDocs.enabled: true`, graphql-doc generates:

- `index.md` (top-level API summary)
- One file per group when `strategy: chunked` (default)
- `api-reference.md` (or custom filename) when `strategy: single`
- `llms.txt` manifest when `generateManifest: true`

## Recommended Config

```yaml
extensions:
  graphql-doc:
    llmDocs:
      enabled: true
      outputDir: ./static/llm-docs
      strategy: chunked
      includeExamples: true
      generateManifest: true
      baseUrl: https://docs.example.com
      apiName: Pay Theory GraphQL API
      apiDescription: Public GraphQL API reference for payment and authorization flows.
```

## Why `baseUrl` Matters

If you use `strategy: chunked`, set `llmDocs.baseUrl` to your deployed docs domain.

Generated markdown is frequently consumed outside the running site (downloaded files, local agent
context, copied snippets). Absolute URLs keep links valid in those workflows.

## Docusaurus Hosting Pattern

Use `outputDir: ./static/llm-docs` so raw markdown is directly accessible:

- `/llm-docs/index.md`
- `/llm-docs/<group>.md`
- `/llms.txt`

## Accept Markdown Middleware (Plugin)

When using `@lewl/graphql-doc/docusaurus-plugin` with `markdownRedirect.enabled: true` (default),
markdown-aware requests can resolve to these generated markdown files during `docusaurus start`.

For production deployments, static hosting still needs explicit server/edge middleware to do
header-based markdown negotiation.

## Multi-Target Guidance

If you generate multiple targets (for example `main` and `lab`), set unique LLM output directories
per target to avoid file collisions.

```yaml
targets:
  - name: main
    llmDocs:
      enabled: true
      outputDir: ./static/llm-docs/main
  - name: lab
    llmDocs:
      enabled: true
      outputDir: ./static/llm-docs/lab
```

## CI Recommendation

```bash
graphql-doc validate --strict
graphql-doc generate --clean-output
```

This keeps markdown artifacts aligned with schema and examples.
