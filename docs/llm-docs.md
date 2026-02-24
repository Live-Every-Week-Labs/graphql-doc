# LLM Docs Guide

LLM docs are raw markdown artifacts optimized for model ingestion and retrieval.

## Why Use It

- Smaller, cleaner markdown payloads for agents/tools.
- Optional single-file output for compact contexts.
- Optional chunked output by `@docGroup`.
- Optional `llms.txt` manifest for discoverability.

## Enable LLM Docs

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
      apiName: Payments API
      apiDescription: Public GraphQL API for payment flows
```

## Strategy

- `chunked` (default): one markdown file per doc group plus index.
- `single`: one file (default filename: `api-reference.md`).

## Docusaurus Hosting Pattern

For Docusaurus, write to `./static/llm-docs` so files are served as raw markdown:

- `/llm-docs/index.md`
- `/llm-docs/<group>.md`
- `/llms.txt` (if `generateManifest` is true)

## Recommended CI Check

Use validation and generation together:

```bash
graphql-doc validate --strict
graphql-doc generate --clean-output
```

This ensures generated LLM docs stay in sync with schema and examples.
