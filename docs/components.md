# Component Library

The component library renders GraphQL DocModel output in a two-column, Stripe/Redocly-style layout. It lives inside the main package and is framework-agnostic.

## Installation

```bash
npm install @graphql-docs/generator
```

```tsx
import {
  OperationView,
  TwoColumnContent,
  ExamplesPanel,
  CodeExample,
  FieldTable,
  ArgumentsTable,
  TypeViewer,
} from '@graphql-docs/generator/components';
import '@graphql-docs/generator/components/styles.css';
```

## Generated MDX (Component-Based)

The generator emits MDX that exports static data and renders components:

```mdx
---
api: true
---

export const operation = { ... };
export const examplesByOperation = { getUser: [ ... ] };

<OperationView operation={operation} />
```

## Two-Column Layout

Wrap MDX content with `TwoColumnContent` to enable the right-side examples panel:

```tsx
<TwoColumnContent examplesByOperation={examplesByOperation}>{children}</TwoColumnContent>
```

`examplesByOperation` keys use the **operation name** (not slug).

## Docusaurus Integration

1. **Swizzle DocItem Layout**

```bash
npm run swizzle @docusaurus/theme-classic DocItem/Layout -- --wrap
```

`src/theme/DocItem/Layout/index.tsx`:

```tsx
import React from 'react';
import Layout from '@theme-original/DocItem/Layout';
import { TwoColumnContent } from '@graphql-docs/generator/components';

export default function LayoutWrapper(props) {
  const isApiDoc = props.content?.frontMatter?.api === true;
  const examplesByOperation = props.content?.examplesByOperation;

  if (!isApiDoc) {
    return <Layout {...props} />;
  }

  return (
    <Layout {...props}>
      <TwoColumnContent examplesByOperation={examplesByOperation}>
        {props.children}
      </TwoColumnContent>
    </Layout>
  );
}
```

2. **Register MDX Components**

`src/theme/MDXComponents.tsx`:

```tsx
import React from 'react';
import MDXComponents from '@theme-original/MDXComponents';
import {
  OperationView,
  TypeViewer,
  FieldTable,
  ArgumentsTable,
  ExamplesPanel,
  CodeExample,
} from '@graphql-docs/generator/components';

export default {
  ...MDXComponents,
  OperationView,
  TypeViewer,
  FieldTable,
  ArgumentsTable,
  ExamplesPanel,
  CodeExample,
};
```

3. **Enable Prism Languages**

```ts
// docusaurus.config.ts
prism: {
  additionalLanguages: ['graphql', 'json'],
},
```

## Component API Highlights

- `OperationView({ operation, defaultExpandedLevels, maxDepth, headingLevel })`
- `FieldTable({ fields, depth, maxDepth, defaultExpandedLevels })`
- `ArgumentsTable({ arguments, depth, maxDepth, defaultExpandedLevels })`
- `ExamplesPanel({ examples, operationName })`
- `CodeExample({ example })`
- `TwoColumnContent({ examplesByOperation, renderExamples })`

## Theming

All components read from `@graphql-docs/generator/components/styles.css` and are themed via CSS custom properties. Common tokens include:

- `--gql-type-color`, `--gql-field-color`, `--gql-description-color`
- `--gql-success-bg`, `--gql-warning-bg`, `--gql-error-bg`
- `--gql-examples-top` (sticky offset)

Override these in your site CSS to customize the look and feel.

## Troubleshooting

- **Examples panel not showing**: Confirm `api: true` frontmatter is present and `examplesByOperation` is exported.
- **No styling**: Ensure `styles.css` is imported once in your app.
- **No GraphQL highlighting**: Add `graphql` to Docusaurus Prism `additionalLanguages`.
