# Usage Guide

## Installation

You can install the generator globally or as a dev dependency in your project.

```bash
# Global installation
npm install -g @graphql-docs/generator

# Local installation
npm install --save-dev @graphql-docs/generator
```

## CLI Usage

The generator provides a CLI for easy documentation generation.

```bash
graphql-docs [options]
```

### Basic Example

Generate documentation from a local schema file:

```bash
graphql-docs --schema ./schema.graphql --output ./docs/api
```

### Using a Config File

You can also use a configuration file (e.g., `graphql-docs.config.js`) to store your settings.

```bash
graphql-docs --config ./graphql-docs.config.js
```

## Integration with Docusaurus

1.  Generate the documentation into your Docusaurus `docs` folder or a subdirectory.
2.  The generator will create `sidebars.js` (or `sidebars.api.js` if `sidebars.js` exists).
3.  If `sidebars.api.js` is generated, import it into your main `sidebars.js`:

```javascript
// sidebars.js
const apiSidebar = require('./sidebars.api.js');

module.exports = {
  ...apiSidebar,
  myOtherSidebar: [ ... ],
};
```
