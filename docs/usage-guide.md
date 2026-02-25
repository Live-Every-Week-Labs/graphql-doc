# Usage Guide

## Installation

You can install the generator globally or as a dev dependency in your project.

```bash
# Global installation
npm install -g @lewl/graphql-doc

# Local installation
npm install --save-dev @lewl/graphql-doc
```

## Docusaurus Plugin Quick Start (Recommended)

Configure the package directly as a Docusaurus plugin so docs are generated during site startup and
build:

```ts
// docusaurus.config.ts
plugins: [
  [
    require.resolve('@lewl/graphql-doc/docusaurus-plugin'),
    {
      configPath: './graphql-doc.config.json',
      schema: './schema.graphql',
      outputDir: './docs/api',
      // Default-on for plugin workflows:
      llmDocs: true,
      markdownRedirect: {
        enabled: true,
      },
    },
  ],
];
```

The plugin runs once per `docusaurus start` / `docusaurus build` lifecycle.

## CLI Quick Start

### 1. Initialize Your Project

The easiest way to get started is with the `init` command:

```bash
# Interactive setup (prompts for configuration)
npx graphql-doc init

# Non-interactive with defaults
npx graphql-doc init --yes
```

This creates:

- `.graphqlrc` - Configuration file
- `docs-metadata/examples/` - Directory for operation examples
- Sample JSON files to get you started

### 2. Generate Documentation

```bash
npx graphql-doc generate --schema ./schema.graphql --output ./docs/api
```

Or if you have a config file:

```bash
npx graphql-doc generate
```

## CLI Commands

### `init`

Initialize a new project with configuration and directory structure.

```bash
graphql-doc init [options]

Options:
  -f, --force   Overwrite existing files
  -y, --yes     Skip prompts, use defaults
```

### `generate`

Generate documentation from your GraphQL schema.

```bash
graphql-doc generate [options]

Options:
  -s, --schema <path>   Path to GraphQL schema file or URL
  -o, --output <path>   Output directory
  -c, --config <path>   Path to config file
```

### `validate`

Validate your schema and metadata without generating docs (useful for CI).

```bash
graphql-doc validate [options]

Options:
  -s, --schema <path>   Path to local GraphQL schema file(s)
  -c, --config <path>   Path to config file
  --strict              Treat warnings as errors
```

`validate` currently supports local schema files only. Remote URL validation is not supported.

## Using a Config File

You can store your settings in a configuration file instead of passing CLI arguments.

```yaml
# .graphqlrc
schema: ./schema.graphql

extensions:
  graphql-doc:
    outputDir: ./docs/api
    framework: docusaurus
    metadataDir: ./docs-metadata
    adapters:
      docusaurus: {}
    schemaExtensions:
      - ./schema/framework-stubs.graphql
```

Then simply run:

```bash
graphql-doc generate
```

See the [Configuration Guide](./configuration.md) for all available options.

## Handling Errors in Docs

For MVP, error documentation is handled in two places:

- **Universal errors** (authentication, rate limits, etc.) should live in your intro docs so they appear at the top of the sidebar.
- **Operation-specific errors** should be shown inside examples using the GraphQL `errors` array with `response.type: "error"` in your example JSON.

### Optional Enhancements

```yaml
extensions:
  graphql-doc:
    configVersion: 1
    # Opt-in only: AI skill files and intro insertion stay disabled unless enabled.
    agentSkill:
      enabled: true
      introDoc:
        enabled: true
        outputPath: intro/ai-agent-skill.mdx
    adapters:
      docusaurus:
        introDocs:
          - ./docs/api-overview.mdx
          - source: ./docs/authentication.mdx
            outputPath: intro/authentication.mdx
        singlePage: false
        typeLinkMode: deep
        sidebarSectionLabels:
          operations: Operations
          types: Types
    excludeDocGroups:
      - Internal
      - Experimental
```

## Integration with Docusaurus

Use the published plugin entrypoint in `plugins`:

```ts
plugins: [
  [
    require.resolve('@lewl/graphql-doc/docusaurus-plugin'),
    {
      configPath: './graphql-doc.config.json',
    },
  ],
];
```

Migration from script/manual generation:

1. Remove custom scripts that run `graphql-doc generate` before Docusaurus.
2. Remove any local markdown redirect plugin in your Docusaurus site.
3. Keep your existing graphql-doc config (`.graphqlrc` or `graphql-doc.config.*`).
4. Add the exported plugin subpath: `@lewl/graphql-doc/docusaurus-plugin`.

The generator still merges into `apiSidebar` by default. If you need separate sidebars, keep using
`adapters.docusaurus.sidebarMerge: false` and `sidebarFile`.

## LLM Docs Output

To expose raw, LLM-optimized Markdown in Docusaurus, write the LLM docs into `static/llm-docs`.
The generator will also emit `llms.txt` at `static/llms.txt`.

```yaml
# .graphqlrc
extensions:
  graphql-doc:
    llmDocs:
      outputDir: ./static/llm-docs
      baseUrl: https://docs.example.com
```

When the site is running, the raw files are available at:

- `/llm-docs/index.md`
- `/llm-docs/<group>.md`
- `/llms.txt`

## Organizing Your Documentation

Use custom directives in your schema to control how operations are grouped and ordered. See the [Directives Guide](./directives.md) for details.

```graphql
type Query {
  getUser(id: ID!): User
    @docGroup(name: "User Management", order: 1)
    @docPriority(level: 1)
    @docTags(tags: ["users", "read"])
}
```

## Adding Examples

Place JSON files in your metadata directories to add examples to your operations.

If you want to organize examples across multiple files/directories, configure `exampleFiles`:

```yaml
extensions:
  graphql-doc:
    exampleFiles:
      - ./docs-metadata/examples/queries/*.json
      - ./docs-metadata/examples/mutations/*.json
```

If you want to fail CI when a documented operation has no examples, enable:

```yaml
extensions:
  graphql-doc:
    requireExamplesForDocumentedOperations: true
```

### Example Files

Create files in `docs-metadata/examples/`:

```json
{
  "operation": "getUser",
  "operationType": "query",
  "examples": [
    {
      "name": "Get User by ID",
      "description": "Retrieve a user's profile",
      "query": "query { getUser(id: \"123\") { id name email } }",
      "variables": { "id": "123" },
      "response": {
        "type": "success",
        "httpStatus": 200,
        "body": {
          "data": {
            "getUser": { "id": "123", "name": "John", "email": "john@example.com" }
          }
        }
      }
    }
  ]
}
```
