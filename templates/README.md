# Templates

This directory contains the Handlebars templates used for generating component-based MDX content.

## Files

- **`operation.hbs`**: Emits a static props export plus `<OperationView />` markup. Supports `dataReference` and passes `typesByName` for type resolution.
- **`type-definition.hbs`**: Emits a static props export plus `<TypeDefinitionView />` markup. Supports `dataReference` to reference external JSON.
- **`arguments.hbs`**, **`type.hbs`**, **`examples.hbs`**: Legacy partials (kept for reference).

## Usage

These templates are loaded by the `MdxRenderer` class in `src/core/renderer/mdx-renderer.ts`.
