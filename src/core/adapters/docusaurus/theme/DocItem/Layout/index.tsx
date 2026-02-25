import type { ComponentProps } from 'react';
import Layout from '@theme-original/DocItem/Layout';
import { useDoc } from '@docusaurus/plugin-content-docs/client';
import { TwoColumnContent } from '@lewl/graphql-doc/components';

type LayoutProps = ComponentProps<typeof Layout>;

/**
 * API docs use the split-pane layout to keep rendered examples alongside the
 * generated operation content. Non-API docs keep the stock Docusaurus layout.
 */
export default function LayoutWrapper(props: LayoutProps) {
  const { frontMatter, metadata } = useDoc();
  const isApiDoc = frontMatter?.api === true;
  const examplesByOperation = metadata?.examplesByOperation;

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
