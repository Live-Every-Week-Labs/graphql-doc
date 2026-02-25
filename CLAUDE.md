# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is `@lewl/graphql-doc` - a documentation generator for GraphQL APIs that organizes content by **operations** (queries, mutations, subscriptions) rather than types. It produces MDX files compatible with Docusaurus.

## Common Commands

```bash
npm run build        # Build with tsup (outputs to dist/)
npm run dev          # Build in watch mode
npm test             # Run all tests with vitest
npm run test:e2e     # Run only e2e tests
npm run lint         # ESLint check
npm run format       # Prettier formatting
npm run typecheck    # TypeScript type checking
```

Run a single test file:

```bash
npx vitest run src/core/generator.test.ts
```

Run tests matching a pattern:

```bash
npx vitest run -t "generates MDX"
```

## Architecture

### Generation Pipeline

The documentation generation flows through these stages:

```
GraphQL Schema → SchemaLoader → SchemaParser → Transformer → DocusaurusAdapter → FileWriter → MDX Files
                                     ↑
                              MetadataLoaders
                          (examples + errors JSON)
```

### Key Components

**Generator** (`src/core/generator.ts`) - Main orchestrator that coordinates the pipeline.

**Parser Layer** (`src/core/parser/`):

- `SchemaLoader` - Loads GraphQL schemas from files or URLs using @graphql-tools
- `SchemaParser` - Extracts operations (queries/mutations/subscriptions) and types
- `DirectiveExtractor` - Parses custom directives (@docGroup, @docPriority, @docTags)
- `TypeCollector` - Collects all type definitions from the schema

**Transformer** (`src/core/transformer/transformer.ts`) - Converts parsed operations into the documentation model:

- Merges external metadata (examples, errors) via `metadata-merger.ts`
- Expands nested types for display via `TypeExpander`
- Groups operations by @docGroup directives into sections/subsections
- Sorts by @docPriority

**Adapters** (`src/core/adapters/`) - Framework-specific output generators:

- `DocusaurusAdapter` - Generates MDX files with front matter, supports single-page or multi-page modes
- `SidebarGenerator` - Creates Docusaurus sidebar configuration

**Renderer** (`src/core/renderer/mdx-renderer.ts`) - Uses Handlebars templates from `templates/` to render operations to MDX.

**CLI** (`src/cli/`) - Three commands:

- `init` - Project scaffolding
- `generate` - Documentation generation
- `validate` - Schema and metadata validation

### Package Exports

- `@lewl/graphql-doc` - Main library exports
- `@lewl/graphql-doc/components` - React component library (in development)
- `@lewl/graphql-doc/components/styles.css` - Component styles

### Configuration

Uses cosmiconfig for flexible config loading. Supports `.graphqlrc`, `graphql-doc.config.js`, etc. Schema defined in `src/core/config/schema.ts` using Zod.

### Templates

Handlebars templates in `templates/`:

- `operation.hbs` - Main operation documentation
- `arguments.hbs` - Arguments table partial
- `type.hbs` - Type rendering partial (recursive)
- `examples.hbs` - Code examples with Docusaurus Tabs

## Workflow Requirements

### Documentation Updates

When making changes or additions that affect a directory's purpose or organization, create or update a README.md in that directory explaining:

- The intention/purpose of the files
- Organization details
- Any important patterns or conventions

### Linear Integration

When working from a Linear task:

1. Complete the implementation
2. Mark the issue as "Done" in Linear
3. Add a comment to the issue summarizing the changes
4. Include the Linear issue ID in commit messages when relevant

## Test Structure

Tests are co-located with source files (`*.test.ts`) and also in `tests/`:

- `tests/unit/` - Unit tests organized by module
- `tests/integration/` - Integration tests
- `src/test/e2e.test.ts` - End-to-end tests

## Custom Directives

The generator supports three custom GraphQL directives for organizing documentation:

- `@docGroup(name: "Section", order: 1, subsection: "Sub")` - Group operations
- `@docPriority(level: 1)` - Sort order within groups
- `@docTags(tags: ["tag1", "tag2"])` - Tags for filtering/search
