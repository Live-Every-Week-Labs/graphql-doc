# Templates

This directory contains the Handlebars templates used for generating MDX content.

## Files

- **`operation.hbs`**: The main layout for an operation page. Renders the title, description, deprecation warning, arguments, return type, and examples.
- **`arguments.hbs`**: A partial that renders a markdown table of arguments for an operation.
- **`type.hbs`**: A recursive partial that renders GraphQL types (Scalars, Objects, Lists, Non-Nulls) with links where appropriate.
- **`examples.hbs`**: A partial that renders request/response examples using Docusaurus `<Tabs>` and `<TabItem>` components.

## Usage

These templates are loaded by the `MdxRenderer` class in `src/core/renderer/mdx-renderer.ts`.
