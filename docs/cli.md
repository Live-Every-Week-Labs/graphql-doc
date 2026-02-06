# CLI Reference

The `graphql-docs` CLI is the primary interface for generating documentation from your GraphQL schema.

## Installation

You can install the generator globally or locally in your project.

```bash
# Global installation
npm install -g @graphql-docs/generator

# Local installation
npm install @graphql-docs/generator
```

## Usage

If installed globally:

```bash
graphql-docs generate [options]
```

If installed locally, use `npx`:

```bash
npx graphql-docs generate [options]
```

## Commands

### `init`

Initialize a new graphql-docs project by creating the configuration file and metadata directory structure.

**Options:**

- `-f, --force`: Overwrite existing files if they exist.
- `-y, --yes`: Skip interactive prompts and use default values.
- `-h, --help`: Display help for the command.

**Examples:**

Initialize with interactive prompts:

```bash
graphql-docs init
```

Initialize with defaults (non-interactive):

```bash
graphql-docs init --yes
```

Force overwrite existing files:

```bash
graphql-docs init --force
```

**Generated Structure:**

The init command creates the following files and directories:

```
.graphqlrc                                    # GraphQL configuration file
graphql-docs-directives.graphql               # Directive definitions for your schema
docs-metadata/
├── examples/
│   ├── queries/
│   │   └── example-query.json               # Sample query example
│   └── mutations/
│       └── example-mutation.json            # Sample mutation example
```

> **Important:** You must include `graphql-docs-directives.graphql` in your schema before deploying to production (AppSync, Apollo Server, etc.). See the [Directive Setup Guide](./directives-setup.md) for detailed instructions.

**Interactive Prompts:**

When run without `--yes`, the command prompts for:

1. **Schema path** - Path to your GraphQL schema file (default: `schema.graphql`)
2. **Output directory** - Where generated docs will be written (default: `./docs/api`)
3. **Metadata directory** - Directory for examples (default: `./docs-metadata`)
4. **Framework** - Documentation framework to use (default: `docusaurus`)

---

### `validate`

Validate your GraphQL schema and metadata files without generating documentation. This is useful for CI/CD pipelines to catch errors early.

**Options:**

- `-s, --schema <path>`: Path to the GraphQL schema file. Defaults to `schema.graphql`.
- `-c, --config <path>`: Path to a configuration file.
- `--strict`: Treat warnings as errors (exit with code 1 if any warnings are found).
- `-h, --help`: Display help for the command.

**Exit Codes:**

- `0`: Validation successful (no errors; warnings are allowed unless `--strict` is used)
- `1`: Validation failed (errors found, or warnings with `--strict`)

**Examples:**

Validate with defaults:

```bash
graphql-docs validate
```

Validate a specific schema:

```bash
graphql-docs validate -s ./graphql/schema.graphql
```

Validate with strict mode (fail on warnings):

```bash
graphql-docs validate --strict
```

**Validation Checks:**

The `validate` command performs the following checks:

1. **Schema Validation**
   - GraphQL SDL syntax is valid
   - Custom directives (`@docGroup`, `@docPriority`, `@docTags`, `@docIgnore`) have required arguments (`@docGroup` requires `name`; `order` is optional)
   - Directive argument types are correct

2. **Example Files Validation**
   - JSON files are valid
   - Required fields (`operation`, `operationType`, `examples`) are present
   - Each example has required fields (`name`, `query`, `response`)
   - `operationType` is one of: `query`, `mutation`, `subscription`
   - Response `type` is one of: `success`, `failure`, `error`
   - Sources come from `exampleFiles` when configured, otherwise `{examplesDir}/**/*.json`

3. **Required Example Coverage (Optional)**
   - When `requireExamplesForDocumentedOperations: true`, every documented operation must have at least one example
   - Operations hidden by `@docIgnore` or excluded via `excludeDocGroups` are skipped

4. **Cross-Validation**
   - Operations referenced in example files exist in the schema (warning)

**Sample Output:**

```
GraphQL Docs Validator

✔ Schema syntax valid (5 operations found)
✔ Example files valid (3 operations documented)
✔ Cross-validation passed

Summary:
  Schema:   ✓ Valid
  Examples: ✓ Valid
Validation successful!
```

---

### `generate`

Generates documentation from a GraphQL schema.

**Options:**

- `-s, --schema <path>`: Path to the GraphQL schema file or URL.
- `-o, --output <path>`: Directory where the generated documentation will be written.
- `-c, --config <path>`: Path to a configuration file (e.g., `.graphqlrc`, `graphql-docs.config.js`).
- `--clean-output`: Remove existing files in the output directory before generating.
- `--llm-docs`: Enable LLM-optimized Markdown output.
- `--no-llm-docs`: Disable LLM-optimized Markdown output.
- `--llm-docs-strategy <strategy>`: LLM docs strategy (`single` or `chunked`).
- `--llm-docs-depth <depth>`: Max LLM type expansion depth (1-5).
- `--no-llm-examples`: Exclude examples from LLM docs output.
- `-h, --help`: Display help for the command.

**Schema Resolution:**

The schema path is resolved in the following order:

1. `-s, --schema` CLI option (highest priority)
2. `schema` field in `.graphqlrc` (graphql-config)
3. Default: `schema.graphql`

This means if you have a `.graphqlrc` file with a `schema` field, you can run `graphql-docs generate` without any arguments.

**Examples:**

Generate using schema from `.graphqlrc`:

```bash
graphql-docs generate
```

Generate from a specific file:

```bash
graphql-docs generate -s ./schema.graphql -o ./docs
```

Generate from a URL (requires `allowRemoteSchema: true` in config):

```bash
graphql-docs generate -s https://api.example.com/graphql -o ./docs
```

Use a specific config file:

```bash
graphql-docs generate -c .graphqlrc.dev
```

## Configuration

The CLI supports standard GraphQL configuration files (`.graphqlrc`, `graphql.config.js`) as well as `graphql-docs.config.js`.

Example `.graphqlrc`:

```yaml
schema: schema.graphql
extensions:
  graphql-docs:
    outputDir: ./docs/api
    framework: docusaurus
    metadataDir: ./docs-metadata
    adapters:
      docusaurus: {}
    schemaExtensions:
      - ./schema/framework-stubs.graphql
```

`schema` in `.graphqlrc` can be a single file or an array of SDL files. When using multiple files,
the generator loads them together and merges any `schemaExtensions`.
