import React, { useMemo } from 'react';
import type { Example } from '../../core/metadata/types';
import { Tabs, type TabDefinition } from '../ui/Tabs';
import { StatusIndicator } from './StatusIndicator';
import { CodeExample } from './CodeExample';

interface ExamplesPanelProps {
  examples: Example[];
  operationName: string;
}

const sortOrder: Record<Example['response']['type'], number> = {
  success: 0,
  failure: 1,
  error: 2,
};

export const ExamplesPanel = React.memo(function ExamplesPanel({
  examples,
  operationName,
}: ExamplesPanelProps) {
  const sortedExamples = useMemo(() => {
    return [...(examples ?? [])].sort(
      (a, b) => sortOrder[a.response.type] - sortOrder[b.response.type]
    );
  }, [examples]);

  if (!sortedExamples.length) {
    return (
      <div className="gql-examples-panel gql-examples-empty" aria-live="polite">
        No examples available for {operationName}.
      </div>
    );
  }

  const tabs: TabDefinition[] = sortedExamples.map((example, index) => ({
    id: `${operationName}-${index}`,
    label: (
      <span className="gql-tab-label">
        <StatusIndicator type={example.response.type} />
        <span className="gql-tab-label-text">{example.name}</span>
      </span>
    ),
    content: <CodeExample example={example} />,
  }));

  return (
    <aside className="gql-examples-panel" aria-label={`Examples for ${operationName}`}>
      <div className="gql-examples-header">Examples</div>
      <Tabs tabs={tabs} />
    </aside>
  );
});
