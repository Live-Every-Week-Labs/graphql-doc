# CLI Module

This module contains the Command Line Interface (CLI) implementation for the `graphql-docs` generator.

## Structure

- `index.ts`: The entry point for the CLI. Uses `commander` to define commands and options.
- `commands/`: Individual command implementations.
  - `generate.ts`: Documentation generation command.
  - `init.ts`: Project initialization command.
  - `validate.ts`: Schema and metadata validation command.

## Commands

### `generate`

The `generate` command is the main entry point for generating documentation. It:

1. Loads configuration using `src/core/config/loader.ts`.
2. Resolves the schema path from CLI option, `.graphqlrc`, or defaults to `schema.graphql`.
3. Instantiates the `Generator` class from `src/core/generator.ts`.
4. Calls `generator.generate()` with the resolved schema path.

Additional generate capabilities:

- `--dry-run` previews planned writes without touching disk.
- `--watch` keeps the process running and regenerates on file changes.
- `--verbose` / `--quiet` control command output verbosity.

**Schema Resolution Priority:**

1. `-s, --schema` CLI option (highest priority)
2. `schema` field in `.graphqlrc` (graphql-config)
3. Default: `schema.graphql`

### `init`

The `init` command scaffolds a new graphql-docs project. It:

1. Creates a `.graphqlrc` configuration file.
2. Creates the `docs-metadata/` directory structure.
3. Adds sample example JSON files.
4. Creates a `graphql-docs-directives.graphql` file with directive definitions.

Supports interactive prompts or `--yes` for defaults.

### `validate`

The `validate` command checks schema and metadata without generating docs. It:

1. Validates GraphQL schema syntax and custom directives.
2. Validates example JSON files against their schema.
3. Cross-validates that referenced operations exist in the schema.
4. Validates required example coverage if configured.

Additional validate capabilities:

- `--json` emits machine-readable output for CI pipelines.
- `--verbose` / `--quiet` control command output verbosity.

Uses validators from `src/core/validation/`. Useful for CI/CD pipelines.

## Development

To test the CLI locally:

```bash
# Run using tsx
npx tsx src/cli/index.ts generate --help
npx tsx src/cli/index.ts init --help
npx tsx src/cli/index.ts validate --help

# Link the package globally
npm link
graphql-docs generate --help
```
