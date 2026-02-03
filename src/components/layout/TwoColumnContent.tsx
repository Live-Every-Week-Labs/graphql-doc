import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import type { Example } from '../../core/metadata/types';
import { ExamplesPanel } from '../examples/ExamplesPanel';
import { useScrollSync } from '../hooks/useScrollSync';

interface TwoColumnContentProps {
  children: React.ReactNode;
  examplesByOperation?: Map<string, Example[]> | Record<string, Example[]>;
  renderExamples?: (operationName: string) => React.ReactNode;
  initialOperation?: string;
  className?: string;
  bodyClassName?: string | false;
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
  bodyClassName = 'gql-docs-page',
}: TwoColumnContentProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const operationKeys = useMemo(() => getOperationKeys(examplesByOperation), [examplesByOperation]);
  const [activeOperation, setActiveOperation] = useState<string | undefined>(
    initialOperation ?? operationKeys[0]
  );

  useEffect(() => {
    if (!activeOperation && operationKeys.length > 0) {
      setActiveOperation(operationKeys[0]);
    }
  }, [activeOperation, operationKeys]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined;
    }

    if (bodyClassName !== false) {
      document.body.classList.add(bodyClassName);
    }

    const root = rootRef.current;
    if (!root) {
      return () => {
        if (bodyClassName !== false) {
          document.body.classList.remove(bodyClassName);
        }
      };
    }

    const findAncestorWithClassToken = (element: HTMLElement, token: string) => {
      let current: HTMLElement | null = element;
      while (current && current !== document.body) {
        if (current.className?.toString().includes(token)) {
          return current;
        }
        current = current.parentElement;
      }
      return null;
    };

    const docCol = findAncestorWithClassToken(root, 'docItemCol');
    const container = root.closest('.container');

    docCol?.classList.add('gql-docs-col');
    container?.classList.add('gql-docs-container');

    return () => {
      docCol?.classList.remove('gql-docs-col');
      container?.classList.remove('gql-docs-container');
      if (bodyClassName !== false) {
        document.body.classList.remove(bodyClassName);
      }
    };
  }, [bodyClassName]);

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
    <div className="gql-docs-shell" ref={rootRef}>
      <div className={containerClassName}>
        <div className="gql-docs-main">{children}</div>
        {hasExamples && <div className="gql-docs-examples">{renderedExamples}</div>}
      </div>
    </div>
  );
});
