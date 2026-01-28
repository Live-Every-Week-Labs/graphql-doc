# Repository Guidelines

## Project Structure & Module Organization

- `src/core` holds the parser/transformer/renderer pipeline plus adapters and validators.
- `src/cli` contains CLI commands; `src/components` ships React UI pieces for Docusaurus.
- `templates/` and `src/templates/` store Handlebars/MDX templates used by the generator.
- Tests live in `tests/` (unit/integration) and `src/test/` (CLI + e2e); fixtures are in `tests/fixtures` and `test_schemas/`.
- `docs/`, `examples/`, and `playground/` are for documentation and demos. `dist/` and `coverage/` are generated outputs.

## Build, Test, and Development Commands

- `npm install` installs dependencies (Node >= 18).
- `npm run build` compiles TypeScript with tsup into `dist/`.
- `npm run dev` runs tsup in watch mode for local development.
- `npm test` runs the full Vitest suite; `npm run test:e2e` runs the e2e test file.
- `npm run lint`, `npm run format`, `npm run typecheck` enforce quality gates.

## Coding Style & Naming Conventions

- Indentation is 2 spaces, LF line endings, single quotes, semicolons, and 100-char print width (Prettier).
- ESLint + Prettier are the source of truth; prefer `npm run format` before PRs.
- Test files use `*.test.ts`. Use descriptive, dash-separated filenames (e.g., `schema-parser.test.ts`).

## Testing Guidelines

- Vitest is the standard. Place new unit/integration tests in `tests/` and CLI/e2e coverage in `src/test/`.
- Reuse fixtures from `tests/fixtures` or `test_schemas/` for deterministic schemas and metadata.

## Commit & Pull Request Guidelines

- Commit messages follow emoji + conventional commit style with optional scope, e.g. `✨ feat(cli): add validate command` or `🐛 fix(core): handle null schema`.
- Keep commits focused and descriptive; include what/why in PR descriptions.
- PRs should note test commands run and link related issues; include screenshots/gifs for UI or documentation rendering changes.

## Configuration Tips

- Local config is typically `.graphqlrc` or `graphql-docs.config.js` at repo root; keep sample config in sync with docs.
