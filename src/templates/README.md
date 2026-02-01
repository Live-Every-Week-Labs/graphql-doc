# Templates

This directory contains the Handlebars templates used for generating component-based MDX content.

## Files

- **`operation.hbs`**: Emits a static props export plus `<OperationView />` markup. Supports `dataReference`, `typesByName`, and `typeLinkMode`.
- **`type-definition.hbs`**: Emits a static props export plus `<TypeDefinitionView />` markup. Supports `dataReference` and `typeLinkMode`.
- **`arguments.hbs`**, **`type.hbs`**, **`examples.hbs`**: Legacy partials (kept for reference).

## Usage

These templates are loaded by the `MdxRenderer` class in `src/core/renderer/mdx-renderer.ts`.
