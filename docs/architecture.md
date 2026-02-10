# Architecture Guide

This project is organized as a pipeline:

1. Load schema and config
2. Parse GraphQL operations/types/directives
3. Load and validate example metadata
4. Transform into the internal doc model
5. Adapt model into framework-specific files
6. Write files to disk

## Core Modules

- `src/core/config`: Zod schema, config loading, migration, and path resolution.
- `src/core/parser`: Schema loading + parsing (`@docGroup`, `@docPriority`, `@docTags`, `@docIgnore`).
- `src/core/metadata`: Example source discovery and JSON loading.
- `src/core/transformer`: Builds `DocModel` with grouped sections and expanded types.
- `src/core/adapters`: Framework output adapters. Docusaurus lives in `src/core/adapters/docusaurus`.
- `src/core/llm-docs`: LLM-optimized markdown + manifest generation.
- `src/core/skills`: Agent skill artifact generation.
- `src/core/file-writer`: Safe filesystem writes and traversal checks.
- `src/core/generator`: Orchestrates the full end-to-end flow.

## Adapter Boundary

Framework-specific concerns belong in adapters:

- MDX rendering and templates
- Sidebar generation/merge behavior
- Intro doc processing
- Front matter conventions

Core keeps framework-agnostic behavior:

- Schema + metadata semantics
- Document model shape
- Validation rules
- Shared serialization utilities

## Testing Convention

- Unit tests are co-located with source (`src/**/*.test.ts`).
- CLI/e2e tests live in `src/test/`.
- Shared fixtures live in `tests/fixtures/`.

## Data Flow Summary

`Generator.generate()` performs:

1. `SchemaLoader.load()`
2. `SchemaParser.parse()`
3. `loadExamples()`
4. `Transformer.transform()`
5. `serializeDocData()`
6. Optional `generateAgentSkillArtifacts()`
7. `createAdapter(config).adapt(model, serialized)`
8. Optional `LlmDocsGenerator.generate()`
9. `FileWriter.write()` (or dry-run preview)
