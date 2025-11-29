# GraphQL Operation-First Documentation Generator

A documentation generator for GraphQL APIs that organizes content by **operation** (queries and mutations) rather than types. Designed to produce beautiful, task-oriented documentation for Docusaurus.

## Documentation

- [Usage Guide](./docs/usage-guide.md)
- [Configuration Guide](./docs/configuration.md)
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

## Usage

### CLI

```bash
# Generate documentation
npx graphql-docs generate

# Initialize configuration
npx graphql-docs init

# Validate schema and metadata
npx graphql-docs validate
```

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

# Lint and format
npm run lint
npm run format
```

## License

MIT
