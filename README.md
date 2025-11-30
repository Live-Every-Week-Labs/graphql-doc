# GraphQL Operation-First Documentation Generator

A documentation generator for GraphQL APIs that organizes content by **operation** (queries and mutations) rather than types. Designed to produce beautiful, task-oriented documentation for Docusaurus.

## Documentation

- [Usage Guide](./docs/usage-guide.md)
- [CLI Reference](./docs/cli.md)
- [Configuration Guide](./docs/configuration.md)
- [Custom Directives](./docs/directives.md)
- [Contributing Guide](./CONTRIBUTING.md)

## Features

- **Operation-First**: Documentation is organized by operations (queries, mutations) rather than types.
- 🧩 **Docusaurus Integration**: Generates MDX files compatible with Docusaurus sidebars.
- 🔍 **Custom Directives**: Use `@docGroup`, `@docPriority`, and `@docTags` to organize your schema.
- 📄 **External Metadata**: Keep your schema clean by loading examples and error definitions from external JSON files.
- 🛠️ **Configurable**: Supports `.graphqlrc`, `graphql-docs.config.js`, and more.

## Installation

```bash
npm install @graphql-docs/generator
```

## Quick Start

### 1. Initialize a Project

```bash
# Interactive setup
npx graphql-docs init

# Or use defaults
npx graphql-docs init --yes
```

This creates a `.graphqlrc` config file and a `docs-metadata/` directory with sample files.

### 2. Generate Documentation

```bash
npx graphql-docs generate -s schema.graphql -o docs/api
```

For more details, see the [CLI Reference](./docs/cli.md).

### Configuration

Create a `.graphqlrc` or `graphql-docs.config.js` file in your project root:

```yaml
# .graphqlrc
schema: './schema.graphql'
extensions:
  graphql-docs:
    outputDir: './docs/api'
    framework: 'docusaurus'
    metadataDir: './docs-metadata'
```

## Development

### Prerequisites

- Node.js >= 18
- npm

### Setup

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test
npm run test:e2e

# Lint and format
npm run lint
npm run format
```

## License

MIT
