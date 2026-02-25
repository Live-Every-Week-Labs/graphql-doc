import MDXComponents from '@theme-init/MDXComponents';
import {
  ArgumentsTable,
  CodeExample,
  ExamplesPanel,
  FieldTable,
  OperationView,
  TypeDefinitionView,
  TypeViewer,
} from '@lewl/graphql-doc/components';

/**
 * Default MDX component map that exposes graphql-doc components without
 * requiring manual swizzle setup in consumer Docusaurus projects.
 */
const graphqlDocMdxComponents: Record<string, unknown> = {
  ...MDXComponents,
  OperationView,
  TypeViewer,
  TypeDefinitionView,
  FieldTable,
  ArgumentsTable,
  ExamplesPanel,
  CodeExample,
};

export default graphqlDocMdxComponents;
