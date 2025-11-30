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
docs-metadata/
├── examples/
│   ├── queries/
│   │   └── example-query.json               # Sample query example
│   └── mutations/
│       └── example-mutation.json            # Sample mutation example
└── errors/
    └── common-errors.json                   # Sample error definitions
```

**Interactive Prompts:**

When run without `--yes`, the command prompts for:

1. **Schema path** - Path to your GraphQL schema file (default: `schema.graphql`)
2. **Output directory** - Where generated docs will be written (default: `./docs/api`)
3. **Metadata directory** - Directory for examples and errors (default: `./docs-metadata`)
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
   - Custom directives (`@docGroup`, `@docPriority`, `@docTags`) have required arguments
   - Directive argument types are correct

2. **Example Files Validation**
   - JSON files are valid
   - Required fields (`operation`, `operationType`, `examples`) are present
   - Each example has required fields (`name`, `query`, `response`)
   - `operationType` is one of: `query`, `mutation`, `subscription`
   - Response `type` is one of: `success`, `failure`, `error`

3. **Error Files Validation**
   - JSON files are valid
   - Required fields (`category`, `operations`, `errors`) are present
   - Each error has required fields (`code`, `message`, `description`)

4. **Cross-Validation**
   - Operations referenced in example files exist in the schema (warning)
   - Operations referenced in error files exist in the schema (warning)
   - Wildcard (`*`) in error operations is always valid

**Sample Output:**

```
GraphQL Docs Validator

✔ Schema syntax valid (5 operations found)
✔ Example files valid (3 operations documented)
✔ Error files valid
✔ Cross-validation passed

Summary:
  Schema:   ✓ Valid
  Examples: ✓ Valid
  Errors:   ✓ Valid

Validation successful!
```

---

### `generate`

Generates documentation from a GraphQL schema.

**Options:**

- `-s, --schema <path>`: Path to the GraphQL schema file or URL. Defaults to `schema.graphql`.
- `-o, --output <path>`: Directory where the generated documentation will be written. Defaults to `docs/api`.
- `-c, --config <path>`: Path to a configuration file (e.g., `.graphqlrc`, `graphql-docs.config.js`).
- `-h, --help`: Display help for the command.

**Examples:**

Generate from a local file:

```bash
graphql-docs generate -s ./schema.graphql -o ./docs
```

Generate from a URL:

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
```
