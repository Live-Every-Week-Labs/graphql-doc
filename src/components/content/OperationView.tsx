import React from 'react';
import type { Operation } from '../../core/transformer/types';
import { slugify } from '../../core/utils/string-utils';
import { ExpansionProvider } from '../context/ExpansionProvider';
import { ArgumentsTable } from './ArgumentsTable';
import { TypeViewer } from './TypeViewer';
import { ExamplesPanel } from '../examples/ExamplesPanel';

interface OperationViewProps {
  operation: Operation;
  defaultExpandedLevels?: number;
  maxDepth?: number;
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  children?: React.ReactNode;
}

const renderDescription = (description?: string) => {
  if (!description) return null;
  const paragraphs = description.split(/\n{2,}/g).map((paragraph) => paragraph.trim());
  return paragraphs.map((paragraph, index) => (
    <p key={index} className="gql-description-text">
      {paragraph}
    </p>
  ));
};

export const OperationView = React.memo(function OperationView({
  operation,
  defaultExpandedLevels = 2,
  maxDepth = 5,
  headingLevel = 2,
  children,
}: OperationViewProps) {
  const slug = slugify(operation.name);
  const HeadingTag = `h${Math.min(6, Math.max(1, headingLevel))}` as keyof JSX.IntrinsicElements;
  const tags = operation.directives?.docTags?.tags ?? [];
  const typeLabel = operation.operationType.toUpperCase();

  return (
    <ExpansionProvider>
      <section className="gql-operation" data-operation={operation.name}>
        <header className="gql-operation-header">
          <div className="gql-operation-title-row">
            <HeadingTag id={slug} className="gql-operation-title">
              {operation.name}
            </HeadingTag>
            <span className={`gql-badge gql-badge-neutral gql-op-type`}>{typeLabel}</span>
            {tags.map((tag) => (
              <span key={tag} className="gql-tag">
                {tag}
              </span>
            ))}
          </div>
          {operation.isDeprecated && (
            <div className="gql-deprecation-warning" role="note">
              <span className="gql-deprecation-label">Deprecated</span>
              {operation.deprecationReason ? `: ${operation.deprecationReason}` : ''}
            </div>
          )}
        </header>

        {(children || operation.description) && (
          <div className="gql-operation-description">
            {children ? children : renderDescription(operation.description)}
          </div>
        )}

        {operation.arguments?.length > 0 && (
          <div className="gql-operation-section">
            <h3 className="gql-section-title">Arguments</h3>
            <ArgumentsTable
              arguments={operation.arguments}
              depth={0}
              maxDepth={maxDepth}
              defaultExpandedLevels={defaultExpandedLevels}
            />
          </div>
        )}

        <div className="gql-operation-section">
          <h3 className="gql-section-title">Response</h3>
          <TypeViewer
            type={operation.returnType}
            depth={0}
            maxDepth={maxDepth}
            defaultExpandedLevels={defaultExpandedLevels}
            path={`operation.${operation.name}.returnType`}
          />
        </div>

        {operation.examples?.length > 0 && (
          <div className="gql-inline-example">
            <ExamplesPanel examples={operation.examples} operationName={operation.name} />
          </div>
        )}
      </section>
    </ExpansionProvider>
  );
});
