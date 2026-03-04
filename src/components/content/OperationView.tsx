import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { Operation, ExpandedType } from '../../core/transformer/types';
import { slugify } from '../../core/utils/string-utils';
import { ExpansionProvider } from '../context/ExpansionProvider';
import { TypeRegistryProvider } from '../context/TypeRegistryProvider';
import { ArgumentsTable } from './ArgumentsTable';
import { TypeViewer } from './TypeViewer';
import { ExamplesPanel } from '../examples/ExamplesPanel';
import { useDocusaurusLayoutBridge } from '../utils/useDocusaurusLayoutBridge';

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
  siteBasePath?: string;
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
  siteBasePath,
  llmDocsDownloadLabel = 'Download Markdown',
  children,
}: OperationViewProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const downloadMenuRef = useRef<HTMLDivElement | null>(null);
  const downloadButtonRef = useRef<HTMLButtonElement | null>(null);
  const menuItemRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
  useDocusaurusLayoutBridge(rootRef);
  const operationSlug = slugify(operation.name) || 'operation';
  const HeadingTag = `h${Math.min(6, Math.max(1, headingLevel))}` as keyof JSX.IntrinsicElements;
  const tags = operation.directives?.docTags?.tags ?? [];
  const typeLabel = operation.operationType.toUpperCase();
  const groupName = operation.directives?.docGroup?.name || 'General';
  const capitalizedGroupName =
    groupName.length > 0 ? `${groupName.charAt(0).toUpperCase()}${groupName.slice(1)}` : groupName;
  const groupSlug = slugify(groupName) || 'general';
  const llmDocsRoot = llmDocsBasePath ? llmDocsBasePath.replace(/\/$/, '') : undefined;
  const groupOverviewHref = llmDocsRoot ? `${llmDocsRoot}/${groupSlug}.md` : undefined;
  const operationDetailsHref = llmDocsRoot
    ? `${llmDocsRoot}/${groupSlug}/${operationSlug}.md`
    : undefined;
  const groupDownloadText = `Download ${capitalizedGroupName} Group`;
  const operationDownloadText = `Download ${operation.name} ${operation.operationType}`;
  const llmDownloadAriaLabel = `${llmDocsDownloadLabel} for ${capitalizedGroupName}`;
  const llmMenuId = `gql-llm-menu-${groupSlug}-${operationSlug}`;

  const focusMenuItem = useCallback((index: number) => {
    const menuItems = menuItemRefs.current.filter(
      (item): item is HTMLAnchorElement => item !== null
    );
    if (menuItems.length === 0) {
      return;
    }
    const normalizedIndex = ((index % menuItems.length) + menuItems.length) % menuItems.length;
    menuItems[normalizedIndex].focus();
  }, []);

  const closeDownloadMenu = useCallback(() => {
    setIsDownloadMenuOpen(false);
  }, []);

  const openDownloadMenu = useCallback(
    (focusIndex?: number) => {
      setIsDownloadMenuOpen(true);
      if (typeof focusIndex === 'number') {
        window.setTimeout(() => focusMenuItem(focusIndex), 0);
      }
    },
    [focusMenuItem]
  );

  const handleDownloadMenuKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (!isDownloadMenuOpen) {
        return;
      }

      const menuItems = menuItemRefs.current.filter(
        (item): item is HTMLAnchorElement => item !== null
      );
      if (menuItems.length === 0) {
        return;
      }

      const currentIndex = menuItems.findIndex((item) => item === document.activeElement);

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          focusMenuItem(currentIndex + 1);
          break;
        case 'ArrowUp':
          event.preventDefault();
          focusMenuItem(currentIndex - 1);
          break;
        case 'Home':
          event.preventDefault();
          focusMenuItem(0);
          break;
        case 'End':
          event.preventDefault();
          focusMenuItem(menuItems.length - 1);
          break;
        case 'Escape':
          event.preventDefault();
          closeDownloadMenu();
          downloadButtonRef.current?.focus();
          break;
        default:
          break;
      }
    },
    [closeDownloadMenu, focusMenuItem, isDownloadMenuOpen]
  );

  const handleDownloadButtonKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          openDownloadMenu(0);
          break;
        case 'ArrowUp':
          event.preventDefault();
          openDownloadMenu(1);
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          if (isDownloadMenuOpen) {
            closeDownloadMenu();
          } else {
            openDownloadMenu();
          }
          break;
        default:
          break;
      }
    },
    [closeDownloadMenu, isDownloadMenuOpen, openDownloadMenu]
  );

  useEffect(() => {
    if (!isDownloadMenuOpen) {
      return;
    }

    const handleDocumentMouseDown = (event: MouseEvent) => {
      if (!downloadMenuRef.current?.contains(event.target as Node)) {
        closeDownloadMenu();
      }
    };

    const handleDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeDownloadMenu();
        downloadButtonRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleDocumentMouseDown);
    document.addEventListener('keydown', handleDocumentKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleDocumentMouseDown);
      document.removeEventListener('keydown', handleDocumentKeyDown);
    };
  }, [closeDownloadMenu, isDownloadMenuOpen]);

  return (
    <TypeRegistryProvider typesByName={typesByName}>
      <ExpansionProvider>
        <section
          className="gql-operation"
          data-operation={operation.name}
          data-site-base-path={siteBasePath}
          ref={rootRef}
        >
          <div className="gql-operation-layout">
            <div className="gql-operation-main">
              <header className="gql-operation-header">
                <div className="gql-operation-title-row">
                  <HeadingTag id={operationSlug} className="gql-operation-title">
                    {operation.name}
                  </HeadingTag>
                  {groupOverviewHref && operationDetailsHref && (
                    <div className="gql-llm-download" ref={downloadMenuRef}>
                      <button
                        type="button"
                        ref={downloadButtonRef}
                        className="gql-llm-download-trigger"
                        aria-label={llmDownloadAriaLabel}
                        title={llmDownloadAriaLabel}
                        aria-expanded={isDownloadMenuOpen}
                        aria-haspopup="true"
                        aria-controls={llmMenuId}
                        onClick={() => setIsDownloadMenuOpen((open) => !open)}
                        onKeyDown={handleDownloadButtonKeyDown}
                      >
                        <MarkdownDownloadIcon />
                        <span className="gql-visually-hidden">{llmDownloadAriaLabel}</span>
                      </button>
                      {isDownloadMenuOpen && (
                        <div
                          id={llmMenuId}
                          className="gql-llm-menu"
                          role="menu"
                          aria-label="Markdown download options"
                          onKeyDown={handleDownloadMenuKeyDown}
                        >
                          <a
                            ref={(node) => {
                              menuItemRefs.current[0] = node;
                            }}
                            className="gql-llm-menu-item"
                            role="menuitem"
                            href={groupOverviewHref}
                            download={`${groupSlug}.md`}
                            onClick={closeDownloadMenu}
                          >
                            {groupDownloadText}
                          </a>
                          <a
                            ref={(node) => {
                              menuItemRefs.current[1] = node;
                            }}
                            className="gql-llm-menu-item"
                            role="menuitem"
                            href={operationDetailsHref}
                            download={`${operationSlug}.md`}
                            onClick={closeDownloadMenu}
                          >
                            {operationDownloadText}
                          </a>
                        </div>
                      )}
                    </div>
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
