import React, { useMemo } from 'react';
import { ExpandedType, ExpandedField, ExpandedTypeKind } from '../../core/transformer/types';
import { useExpansion } from '../context/ExpansionProvider';
import { FieldTable } from './FieldTable';

interface TypeViewerProps {
  type: ExpandedType;
  depth?: number;
  defaultExpandedLevels?: number;
  maxDepth?: number;
  path?: string; // Unique path for expansion tracking
  labelPrefix?: string;
  labelSuffix?: string;
}

export const TypeViewer = React.memo(function TypeViewer({
  type,
  depth = 0,
  defaultExpandedLevels = 2,
  maxDepth = 10,
  path = 'root',
  labelPrefix = '',
  labelSuffix = '',
}: TypeViewerProps) {
  const { isExpanded, toggleExpand } = useExpansion();

  // Memoize state calculation
  const expanded = isExpanded(path, depth, defaultExpandedLevels);

  // Helper to handle toggles
  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleExpand(path, expanded);
  };

  if (!type) {
    return <span className="gql-type-error">Unknown Type</span>;
  }

  // 1. SCALAR
  if (type.kind === 'SCALAR') {
    return (
      <span className="gql-type font-mono">
        {labelPrefix}
        {type.name}
        {labelSuffix}
      </span>
    );
  }

  // 2. LIST
  if (type.kind === 'LIST') {
    return (
      <span className="gql-type-list">
        [
        {/* Pass prefix/suffix if needed, or handle wrapping here. 
            For simplicitly, wrapping here as per previous logic, 
            but could delegate if "bracket attachment" logic is preferred. 
            Keeping it simple as per working version. */}
        <TypeViewer
          type={type.ofType}
          depth={depth}
          defaultExpandedLevels={defaultExpandedLevels}
          maxDepth={maxDepth}
          path={`${path}.list`}
        />
        ]
      </span>
    );
  }

  // 3. CIRCULAR_REF
  if (type.kind === 'CIRCULAR_REF') {
    return (
      <span className="gql-type">
        {labelPrefix}
        <a
          href={type.link}
          className="gql-type-link gql-circular-ref"
          title={`Circular reference to ${type.ref}`}
        >
          {type.ref} ↩
        </a>
        {labelSuffix}
      </span>
    );
  }

  // 4. TYPE_REF
  if (type.kind === 'TYPE_REF') {
    return (
      <span className="gql-type">
        {labelPrefix}
        <a href={type.link} className="gql-type-link">
          {type.name}
        </a>
        {labelSuffix}
      </span>
    );
  }

  // 5. ENUM
  if (type.kind === 'ENUM') {
    return (
      <div className="gql-enum-viewer">
        <span className="gql-type">{type.name}</span>
        <span className="gql-enum-badge">ENUM</span>
      </div>
    );
  }

  // 6. OBJECT / INTERFACE / INPUT_OBJECT
  if (type.kind === 'OBJECT' || type.kind === 'INTERFACE' || type.kind === 'INPUT_OBJECT') {
    const isExpandable = type.fields && type.fields.length > 0;

    // If max depth reached, just show name
    if (depth >= maxDepth) {
      return <span className="gql-type">{type.name}</span>;
    }

    return (
      <div className="gql-tree-node">
        <div
          className={`gql-expand-toggle ${isExpandable ? '' : 'cursor-default'}`}
          onClick={isExpandable ? handleToggle : undefined}
        >
          {isExpandable && (
            <span className={`gql-arrow ${expanded ? 'gql-arrow-down' : 'gql-arrow-right'}`}>
              ▶
            </span>
          )}
          <span className="gql-type">{type.name}</span>
        </div>

        {expanded && isExpandable && (
          <div className="gql-nested-content">
            <FieldTable
              fields={type.fields}
              depth={depth + 1}
              maxDepth={maxDepth}
              defaultExpandedLevels={defaultExpandedLevels}
            />
          </div>
        )}
      </div>
    );
  }

  // 7. UNION
  if (type.kind === 'UNION') {
    return (
      <div className="gql-union-viewer">
        <span className="gql-type-keyword">union</span>
        <span className="gql-type">{type.name}</span>
        <span className="gql-operator">=</span>
        {type.possibleTypes.map((t, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="gql-operator">|</span>}
            <TypeViewer
              type={t}
              depth={depth}
              maxDepth={maxDepth}
              defaultExpandedLevels={defaultExpandedLevels}
              path={`${path}.union.${i}`}
            />
          </React.Fragment>
        ))}
      </div>
    );
  }

  // Fallback
  return <span style={{ color: 'red' }}>Unknown Type Kind</span>;
});
