# Docusaurus Plugin Runtime

This directory contains the publishable Docusaurus plugin runtime for
`@lewl/graphql-doc`.

## Why This Lives Here

All Docusaurus-specific behavior belongs in the adapter layer to preserve
isolation from framework-agnostic pipeline logic.

## Files

- `index.ts`:
  Plugin entrypoint and lifecycle hook wiring.
- `options.ts`:
  Plugin option contracts and normalization defaults.
- `run-generation.ts`:
  Runtime generation orchestration (config load, schema resolution,
  generator invocation) used by plugin hooks.

## Ownership Boundary

- Keep Docusaurus plugin runtime logic in this directory.
- Reuse `src/core/generator.ts` and `src/core/config/*` for shared pipeline
  behavior; do not duplicate parser/transformer/renderer internals here.

## Lifecycle Semantics

- The plugin runs generation in `loadContent`.
- Generation is memoized to a single execution per Docusaurus lifecycle.
- Watch mode is intentionally deferred; the plugin currently performs one pass
  per `docusaurus start` / `docusaurus build` invocation.
