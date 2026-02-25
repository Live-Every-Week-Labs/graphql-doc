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
  generator invocation, and watch-target discovery used by plugin hooks.
- `markdown-redirect.ts`:
  Dev-server middleware for `Accept: text/markdown` redirects into generated
  LLM markdown artifacts with `baseUrl` awareness.
- `../theme/*`:
  Default swizzlable theme components (`MDXComponents` and `DocItem/Layout`)
  automatically exposed through the plugin.

## Ownership Boundary

- Keep Docusaurus plugin runtime logic in this directory.
- Reuse `src/core/generator.ts` and `src/core/config/*` for shared pipeline
  behavior; do not duplicate parser/transformer/renderer internals here.

## Lifecycle Semantics

- `validateOptions` is exported at module level so startup validation errors are
  surfaced by Docusaurus.
- `loadContent` runs generation each time Docusaurus invokes the hook.
- `getPathsToWatch` watches local schema/config/metadata paths so `docusaurus start`
  can trigger regeneration on change.
- `getClientModules` auto-injects `@lewl/graphql-doc/components` CSS assets.
- `getThemePath` exposes default theme wrappers, removing manual swizzle
  boilerplate for common setups.
- `contentLoaded` publishes generation metadata with `setGlobalData`.
- `postBuild` logs a build summary unless `quiet` mode is enabled.
- Markdown redirect middleware remains enabled by default and can be disabled
  with plugin options.
