# Component Library

The component library renders GraphQL DocModel output in a two-column, Stripe/Redocly-style layout. It lives inside the main package and is framework-agnostic.

## Installation

```bash
npm install @lewl/graphql-doc
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
} from '@lewl/graphql-doc/components';
import '@lewl/graphql-doc/components/styles.css';
// Optional: sidebar helpers for the Docusaurus adapter
import '@lewl/graphql-doc/components/docusaurus.css';
```

If you are not using Docusaurus, you can skip the `docusaurus.css` import.

## Generated MDX (Component-Based)

The generator emits MDX that imports shared JSON maps and renders components:

```mdx
---
api: true
---

import { OperationView } from '@lewl/graphql-doc/components';
import operationsByType from '../_data/operations.json';
import typesByName from '../_data/types.json';

export const operation = operationsByType.query.user;
export const examplesByOperation = {
  user: operationsByType.query.user?.examples ?? [],
};

<OperationView operation={operation} typesByName={typesByName} />
```

## Two-Column Layout

Wrap MDX content with `TwoColumnContent` to enable the right-side examples panel:

```tsx
<TwoColumnContent examplesByOperation={examplesByOperation}>{children}</TwoColumnContent>
```

`examplesByOperation` keys use the **operation name** (not slug).

In Docusaurus, wrap API pages in a `gql-docs-page` element (see the swizzle snippet below)
so the adapter’s layout overrides only affect API docs. `TwoColumnContent` also attempts to
apply this class to `body` when it mounts; to disable that behavior, set `bodyClassName={false}`.

## Docusaurus Integration

1. **Swizzle DocItem Layout**

```bash
npm run swizzle @docusaurus/theme-classic DocItem/Layout -- --wrap
```

`src/theme/DocItem/Layout/index.tsx`:

```tsx
import React from 'react';
import Layout from '@theme-original/DocItem/Layout';
import { TwoColumnContent } from '@lewl/graphql-doc/components';

export default function LayoutWrapper(props) {
  const isApiDoc = props.content?.frontMatter?.api === true;
  const examplesByOperation = props.content?.examplesByOperation;

  if (!isApiDoc) {
    return <Layout {...props} />;
  }

  return (
    <div className="gql-docs-page">
      <Layout {...props}>
        <TwoColumnContent examplesByOperation={examplesByOperation}>
          {props.children}
        </TwoColumnContent>
      </Layout>
    </div>
  );
}
```

2. **(Optional) Register MDX Components**

The Docusaurus adapter now emits explicit imports for `OperationView` and
`TypeDefinitionView` in generated MDX, so the core pages will work without
theme overrides. Use this step only if you want to reference the component
library in your own MDX docs or override the defaults.

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
} from '@lewl/graphql-doc/components';

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

- `OperationView({ operation, typesByName, typeLinkBase, defaultExpandedLevels, maxDepth, headingLevel, typeLinkMode, llmDocsBasePath, llmDocsDownloadLabel })` (defaults: 0/0, typeLinkMode: `none`)
- `TypeDefinitionView({ type, typesByName, typeLinkBase, headingLevel, typeLinkMode })`
- `TypeViewer({ type, typeLinkBase, typeLinkMode, depth, maxDepth, defaultExpandedLevels })`
- `FieldTable({ fields, typeLinkBase, depth, maxDepth, defaultExpandedLevels, typeLinkMode })` (defaults: 0/0, typeLinkMode: `none`)
- `ArgumentsTable({ arguments, typeLinkBase, depth, maxDepth, defaultExpandedLevels, typeLinkMode })` (defaults: 0/0, typeLinkMode: `none`)
- `ExamplesPanel({ examples, operationName })`
- `CodeExample({ example })`
- `TwoColumnContent({ examplesByOperation, renderExamples, bodyClassName })`

`typeLinkBase` is used to build links to generated type pages (e.g. `types/enums/*`, `types/inputs/*`, `types/types/*`). When omitted, link targets fall back to the inline `#type` anchors produced by the transformer.

## Theming

All components read from `@lewl/graphql-doc/components/styles.css` and are themed via CSS custom properties. Common tokens include:

- `--gql-type-color`, `--gql-field-color`, `--gql-description-color`
- `--gql-success-bg`, `--gql-warning-bg`, `--gql-error-bg`
- `--gql-examples-top` (sticky offset)

Override these in your site CSS to customize the look and feel.

## Troubleshooting

- **Examples panel not showing**: Confirm `api: true` frontmatter is present and `examplesByOperation` is exported.
- **No styling**: Ensure `styles.css` is imported once in your app.
- **No GraphQL highlighting**: Add `graphql` to Docusaurus Prism `additionalLanguages`.
