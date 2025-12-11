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
    toggleExpand(path, expanded); // Pass current state so provider knows
  };

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
    // Instead of wrapping in a span with brackets that enclose the whole block,
    // we pass the brackets down to the inner type so they appear as part of the label.
    // This allows the inner type (e.g. Object) to handle expansion without the brackets moving weirdly around the content block.
    return (
      <TypeViewer
        type={type.ofType}
        depth={depth}
        defaultExpandedLevels={defaultExpandedLevels}
        maxDepth={maxDepth}
        path={`${path}.list`}
        labelPrefix={`[${labelPrefix}`}
        labelSuffix={`${labelSuffix}]`}
      />
    );
  }

  // 3. CIRCULAR_REF
  if (type.kind === 'CIRCULAR_REF') {
    return (
      <span className="gql-type">
        {labelPrefix}
        <a href={`#${type.link}`} className="gql-type" title={`Go to ${type.ref}`}>
          ↻ {type.ref}
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
        <a href={`#${type.link}`} className="gql-type">
          {type.name}
        </a>
        {labelSuffix}
      </span>
    );
  }

  // 5. ENUM
  if (type.kind === 'ENUM') {
    // ENUMs are usually leaf nodes but can have values shown on expansion?
    // Issue says: "Name + expandable values list"
    const hasValues = type.values && type.values.length > 0;

    return (
      <div className="gql-tree-node">
        <div
          className={`gql-expand-toggle ${hasValues ? '' : 'cursor-default'}`}
          onClick={hasValues ? handleToggle : undefined}
        >
          <span className="gql-type">
            {labelPrefix}
            {type.name}
            {labelSuffix}
          </span>
          {hasValues && (
            <span className={`gql-toggle-icon ${expanded ? 'is-expanded' : ''}`}>▶</span>
          )}
        </div>

        {hasValues && expanded && (
          <div className="gql-nested-content">
            {type.values.map((val) => (
              <div key={val.name} className="gql-enum-value">
                <span className="gql-field">{val.name}</span>
                {val.description && (
                  <span className="gql-description ml-2">- {val.description}</span>
                )}
                {val.isDeprecated && <span className="gql-deprecated">Deprecated</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 6. OBJECT / INTERFACE / INPUT_OBJECT
  if (type.kind === 'OBJECT' || type.kind === 'INTERFACE' || type.kind === 'INPUT_OBJECT') {
    // Check max depth to stop recursion
    if (depth >= maxDepth) {
      return (
        <span className="gql-type opacity-50" title="Max depth reached">
          {labelPrefix}
          {type.name}
          {labelSuffix}...
        </span>
      );
    }

    const hasFields = type.fields && type.fields.length > 0;

    return (
      <div className="gql-tree-node">
        <div
          className={`gql-expand-toggle ${hasFields ? '' : 'cursor-default'}`}
          onClick={hasFields ? handleToggle : undefined}
        >
          <span className="gql-type">
            {labelPrefix}
            {type.name}
            {labelSuffix}
          </span>
          {hasFields && (
            <span className={`gql-toggle-icon ${expanded ? 'is-expanded' : ''}`}>▶</span>
          )}
        </div>

        {hasFields && expanded && (
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
    const hasTypes = type.possibleTypes && type.possibleTypes.length > 0;

    return (
      <div className="gql-tree-node">
        <div
          className={`gql-expand-toggle ${hasTypes ? '' : 'cursor-default'}`}
          onClick={hasTypes ? handleToggle : undefined}
        >
          <span className="gql-type">
            {labelPrefix}
            {type.name}
            {labelSuffix}
          </span>
          {hasTypes && (
            <span className={`gql-toggle-icon ${expanded ? 'is-expanded' : ''}`}>▶</span>
          )}
        </div>

        {hasTypes && expanded && (
          <div className="gql-nested-content">
            <div className="gql-description" style={{ marginBottom: '4px' }}>
              Possible Types:
            </div>
            {type.possibleTypes.map((pt) => (
              <div
                key={(pt as any).name || (pt as any).ref || 'list'}
                style={{ marginBottom: '4px' }}
              >
                <TypeViewer
                  type={pt}
                  depth={depth + 1}
                  defaultExpandedLevels={defaultExpandedLevels}
                  maxDepth={maxDepth}
                  path={`${path}.${(pt as any).name || (pt as any).ref || 'type'}`}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Fallback
  return <span style={{ color: 'red' }}>Unknown Type Kind</span>;
});
