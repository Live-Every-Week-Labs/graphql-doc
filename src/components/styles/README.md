# Styles

This directory contains the styling system for the GraphQL documentation generator.

## `graphql-docs.css`

The core stylesheet is `graphql-docs.css`. It uses [CSS Custom Properties (Variables)](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties) to define the theme.

### Theming

The system supports Light and Dark modes.

- **Light Mode**: Defined in `:root`.
- **Dark Mode**: Defined in `[data-theme='dark']` (compatible with Docusaurus).

### Customization

Users can override any variable in their own CSS to customize the look and feel.

**Key Variables:**

- `--gql-type-color`: Color for GraphQL types/links.
- `--gql-field-color`: Color for field names.
- `--gql-examples-top`: Sticky offset for the examples panel.
- `--gql-nested-line`: Color for nested list guide line.
- `--gql-primary-color` (conceptually, though we use specific tokens).

### Utility Classes

We provide utility classes to apply these standard styles to generated content:

- `.gql-type`: Applies typography and color for types.
- `.gql-field`: Applies styling for field names.
- `.gql-description`: For description text.
- `.gql-required-badge`: For required field badges.
- `.gql-badge`: Base class for status badges.
  - `.gql-badge-success`
  - `.gql-badge-warning`
  - `.gql-badge-error`
  - `.gql-badge-neutral`

### Sidebar Helpers

These classes are used by the Docusaurus adapter but can be reused elsewhere:

- `.gql-sidebar-divider`: Lightweight horizontal divider.
- `.gql-sidebar-section-title`: Section header label for grouped sidebar items.

### Layout & Examples

- `.gql-docs-content`, `.gql-docs-main`, `.gql-docs-examples`: Two-column layout wrappers.
- `.gql-examples-panel`: Sticky examples panel with tabs.
- `.gql-tabs`, `.gql-tab`, `.gql-tab-panel`: Base tab styling.
  - `.gql-badge-error`

### Component Specific Classes

For list-based field rendering:

- `.gql-field-list`, `.gql-field-item`: List container + item row.
- `.gql-field-toggle`: Inline expand/collapse button.
- `.gql-field-children`: Nested list container with a guide line.
- `.gql-field-enum-values`: Enum value chips in lists.
