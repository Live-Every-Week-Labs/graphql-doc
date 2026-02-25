import React from 'react';
import type { Operation, ExpandedType } from '../../core/transformer/types';
import { slugify } from '../../core/utils/string-utils';
import { ExpansionProvider } from '../context/ExpansionProvider';
import { TypeRegistryProvider } from '../context/TypeRegistryProvider';
import { ArgumentsTable } from './ArgumentsTable';
import { TypeViewer } from './TypeViewer';
import { ExamplesPanel } from '../examples/ExamplesPanel';

const MARKDOWN_ICON_PATH =
  'M922 319q-1 0 -2 1h-11v0h-836q-18 0 -33.5 8.5t-25.5 22.5q-17 26 -13 57v461q1 18 11 32.5t24 22.5q25 14 55 10v1l843 -1q18 -1 32.5 -11t22.5 -24q14 -24 10 -55h1l-1 -459q-1 -17 -11 -31.5t-24 -23.5q-19 -10 -42 -11zM918 367h2q12 0 20 5q6 3 8.5 6.5t2.5 9.5l1 456v3q2 16 -5 29q-3 5 -6.5 7.5t-9.5 2.5l-840 1h-3q-16 2 -28 -5q-6 -3 -8.5 -6.5t-2.5 -9.5v-458l-1 -4q-2 -14 5.5 -25t18.5 -11h837zM145 464v327h96v-188l96 120l96 -120v188h96v-327h-96l-96 120l-96 -120h-96zM697 464v168h-96l144 159l144 -159h-96v-168h-96z';

interface OperationViewProps {
  operation: Operation;
  typeLinkBase?: string;
  defaultExpandedLevels?: number;
  maxDepth?: number;
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  typesByName?: Record<string, ExpandedType>;
  typeLinkMode?: 'none' | 'deep' | 'all';
  llmDocsBasePath?: string;
  llmDocsDownloadLabel?: string;
  children?: React.ReactNode;
}

const MarkdownDownloadIcon = () => (
  <svg
    className="gql-llm-download-icon"
    viewBox="-10 -5 1034 1034"
    aria-hidden="true"
    focusable="false"
  >
    <path d={MARKDOWN_ICON_PATH} />
  </svg>
);

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
  typeLinkBase,
  defaultExpandedLevels = 0,
  maxDepth = 5,
  headingLevel = 2,
  typesByName,
  typeLinkMode = 'none',
  llmDocsBasePath,
  llmDocsDownloadLabel = 'Download Markdown',
  children,
}: OperationViewProps) {
  const slug = slugify(operation.name);
  const HeadingTag = `h${Math.min(6, Math.max(1, headingLevel))}` as keyof JSX.IntrinsicElements;
  const tags = operation.directives?.docTags?.tags ?? [];
  const typeLabel = operation.operationType.toUpperCase();
  const groupName = operation.directives?.docGroup?.name || 'General';
  const groupSlug = slugify(groupName);
  const llmDocsHref = llmDocsBasePath
    ? `${llmDocsBasePath.replace(/\/$/, '')}/${groupSlug}.md`
    : undefined;
  const llmDownloadAriaLabel = `${llmDocsDownloadLabel} for ${groupName}`;

  return (
    <TypeRegistryProvider typesByName={typesByName}>
      <ExpansionProvider>
        <section className="gql-operation" data-operation={operation.name}>
          <div className="gql-operation-layout">
            <div className="gql-operation-main">
              <header className="gql-operation-header">
                <div className="gql-operation-title-row">
                  <HeadingTag id={slug} className="gql-operation-title">
                    {operation.name}
                  </HeadingTag>
                  {llmDocsHref && (
                    <a
                      className="gql-llm-download"
                      href={llmDocsHref}
                      download={`${groupSlug}.md`}
                      aria-label={llmDownloadAriaLabel}
                      title={llmDownloadAriaLabel}
                    >
                      <MarkdownDownloadIcon />
                      <span className="gql-visually-hidden">{llmDownloadAriaLabel}</span>
                    </a>
                  )}
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
                    typeLinkBase={typeLinkBase}
                    typeLinkMode={typeLinkMode}
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
                  typeLinkBase={typeLinkBase}
                  typeLinkMode={typeLinkMode}
                  depth={0}
                  maxDepth={maxDepth}
                  defaultExpandedLevels={defaultExpandedLevels}
                  path={`operation.${operation.name}.returnType`}
                />
              </div>
            </div>

            {operation.examples?.length > 0 && (
              <aside className="gql-operation-examples">
                <ExamplesPanel examples={operation.examples} operationName={operation.name} />
              </aside>
            )}
          </div>
        </section>
      </ExpansionProvider>
    </TypeRegistryProvider>
  );
});
