# Usage Guide

## Installation

You can install the generator globally or as a dev dependency in your project.

```bash
# Global installation
npm install -g @graphql-docs/generator

# Local installation
npm install --save-dev @graphql-docs/generator
```

## Quick Start

### 1. Initialize Your Project

The easiest way to get started is with the `init` command:

```bash
# Interactive setup (prompts for configuration)
npx graphql-docs init

# Non-interactive with defaults
npx graphql-docs init --yes
```

This creates:

- `.graphqlrc` - Configuration file
- `docs-metadata/examples/` - Directory for operation examples
- `docs-metadata/errors/` - Directory for error definitions
- Sample JSON files to get you started

### 2. Generate Documentation

```bash
npx graphql-docs generate --schema ./schema.graphql --output ./docs/api
```

Or if you have a config file:

```bash
npx graphql-docs generate
```

## CLI Commands

### `init`

Initialize a new project with configuration and directory structure.

```bash
graphql-docs init [options]

Options:
  -f, --force   Overwrite existing files
  -y, --yes     Skip prompts, use defaults
```

### `generate`

Generate documentation from your GraphQL schema.

```bash
graphql-docs generate [options]

Options:
  -s, --schema <path>   Path to GraphQL schema file or URL
  -o, --output <path>   Output directory
  -c, --config <path>   Path to config file
```

## Using a Config File

You can store your settings in a configuration file instead of passing CLI arguments.

```yaml
# .graphqlrc
schema: ./schema.graphql

extensions:
  graphql-docs:
    outputDir: ./docs/api
    framework: docusaurus
    metadataDir: ./docs-metadata
```

Then simply run:

```bash
graphql-docs generate
```

See the [Configuration Guide](./configuration.md) for all available options.

## Integration with Docusaurus

1. Generate the documentation into your Docusaurus `docs` folder or a subdirectory.

2. The generator will create `sidebars.js` (or `sidebars.api.js` if `sidebars.js` exists).

3. If `sidebars.api.js` is generated, import it into your main `sidebars.js`:

```javascript
// sidebars.js
const apiSidebar = require('./sidebars.api.js');

module.exports = {
  ...apiSidebar,
  myOtherSidebar: [ ... ],
};
```

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

## Adding Examples and Error Documentation

Place JSON files in your metadata directories to add examples and error documentation to your operations.

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

### Error Files

Create files in `docs-metadata/errors/`:

```json
{
  "category": "Authentication",
  "operations": ["*"],
  "errors": [
    {
      "code": "UNAUTHORIZED",
      "message": "Authentication required",
      "description": "The request requires a valid authentication token.",
      "resolution": "Include a valid JWT in the Authorization header."
    }
  ]
}
```

The `operations` array can contain specific operation names or `"*"` to apply to all operations.
