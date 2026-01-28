import React from 'react';
import Layout from '@theme-original/DocItem/Layout';
import { TwoColumnContent } from '@graphql-docs/generator/components';

export default function LayoutWrapper(props: any) {
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
