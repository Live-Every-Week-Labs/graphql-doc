import React, { useMemo, useState, useCallback, useEffect } from 'react';
import type { Example } from '../../core/metadata/types';
import { ExamplesPanel } from '../examples/ExamplesPanel';
import { useScrollSync } from '../hooks/useScrollSync';

interface TwoColumnContentProps {
  children: React.ReactNode;
  examplesByOperation?: Map<string, Example[]> | Record<string, Example[]>;
  renderExamples?: (operationName: string) => React.ReactNode;
  initialOperation?: string;
  className?: string;
}

const getExamplesFromSource = (
  source: TwoColumnContentProps['examplesByOperation'],
  operationName: string
) => {
  if (!source) return undefined;
  if (source instanceof Map) {
    return source.get(operationName);
  }
  return source[operationName];
};

const getOperationKeys = (source: TwoColumnContentProps['examplesByOperation']) => {
  if (!source) return [];
  if (source instanceof Map) {
    return Array.from(source.keys());
  }
  return Object.keys(source);
};

export const TwoColumnContent = React.memo(function TwoColumnContent({
  children,
  examplesByOperation,
  renderExamples,
  initialOperation,
  className,
}: TwoColumnContentProps) {
  const operationKeys = useMemo(() => getOperationKeys(examplesByOperation), [examplesByOperation]);
  const [activeOperation, setActiveOperation] = useState<string | undefined>(
    initialOperation ?? operationKeys[0]
  );

  useEffect(() => {
    if (!activeOperation && operationKeys.length > 0) {
      setActiveOperation(operationKeys[0]);
    }
  }, [activeOperation, operationKeys]);

  const handleVisibleChange = useCallback(
    (operationName: string) => {
      setActiveOperation(operationName);
    },
    [setActiveOperation]
  );

  useScrollSync(handleVisibleChange);

  const examples = activeOperation
    ? getExamplesFromSource(examplesByOperation, activeOperation)
    : undefined;

  const renderedExamples = useMemo(() => {
    if (!activeOperation) return null;
    if (renderExamples) {
      return renderExamples(activeOperation);
    }
    if (examples) {
      return <ExamplesPanel examples={examples} operationName={activeOperation} />;
    }
    return null;
  }, [activeOperation, renderExamples, examples]);

  const hasExamples = Boolean(renderedExamples);
  const containerClassName = [
    'gql-docs-content',
    hasExamples ? 'gql-docs-content--has-examples' : 'gql-docs-content--no-examples',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  return (
    <div className="gql-docs-shell">
      <div className={containerClassName}>
        <div className="gql-docs-main">{children}</div>
        {hasExamples && <div className="gql-docs-examples">{renderedExamples}</div>}
      </div>
    </div>
  );
});
