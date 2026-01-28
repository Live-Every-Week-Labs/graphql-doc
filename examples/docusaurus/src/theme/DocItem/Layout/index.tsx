import React from 'react';
import Layout from '@theme-original/DocItem/Layout';
import { TwoColumnContent } from '@graphql-docs/generator/components';
import { useDoc } from '@docusaurus/plugin-content-docs/client';

export default function LayoutWrapper(props: any) {
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
