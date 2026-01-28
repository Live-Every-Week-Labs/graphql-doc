import React from 'react';
import { ExpandedType } from '../../core/transformer/types';
import { slugify } from '../../core/utils/string-utils';
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
  defaultExpandedLevels = 0,
  maxDepth = 3,
  path = 'root',
  labelPrefix = '',
  labelSuffix = '',
}: TypeViewerProps) {
  if (!type) {
    return <span className="gql-type-error">Unknown Type</span>;
  }

  const unwrapType = (input: ExpandedType) => {
    let current = input;
    let isList = false;

    while (current.kind === 'LIST') {
      isList = true;
      current = current.ofType;
    }

    return { baseType: current, isList };
  };

  const renderInlineType = (input: ExpandedType): React.ReactNode => {
    switch (input.kind) {
      case 'LIST':
        return (
          <span className="gql-type-list">
            <span className="gql-bracket">[</span>
            {renderInlineType(input.ofType)}
            <span className="gql-bracket">]</span>
          </span>
        );
      case 'TYPE_REF':
        return (
          <a href={input.link} className="gql-type-link">
            {input.name}
          </a>
        );
      case 'CIRCULAR_REF':
        return (
          <a
            href={input.link}
            className="gql-type-link gql-circular-ref"
            title={`Circular reference to ${input.ref}`}
          >
            {input.ref} ↩
          </a>
        );
      case 'SCALAR':
      case 'ENUM':
      case 'OBJECT':
      case 'INTERFACE':
      case 'INPUT_OBJECT':
      case 'UNION':
        return <span>{input.name}</span>;
      default:
        return <span>Unknown</span>;
    }
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
    const { baseType } = unwrapType(type);
    if (
      baseType.kind === 'OBJECT' ||
      baseType.kind === 'INTERFACE' ||
      baseType.kind === 'INPUT_OBJECT'
    ) {
      return (
        <div className="gql-type-block">
          <div className="gql-type-heading">
            {labelPrefix}
            <span className="gql-type-collection">Array</span>
            <span className="gql-type">{baseType.name}</span>
            {labelSuffix}
          </div>
          {baseType.fields?.length ? (
            <FieldTable
              fields={baseType.fields}
              depth={depth}
              maxDepth={maxDepth}
              defaultExpandedLevels={defaultExpandedLevels}
            />
          ) : (
            <span className="gql-no-desc">No fields</span>
          )}
        </div>
      );
    }

    return <span className="gql-type font-mono">{renderInlineType(type)}</span>;
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
    const moreCount = type.values?.length ? type.values.length - 25 : 0;
    return (
      <div className="gql-enum-viewer">
        <span className="gql-type">{type.name}</span>
        <span className="gql-enum-badge">ENUM</span>
        {type.values?.length ? (
          <div className="gql-enum-values">
            {type.values.slice(0, 25).map((value) => (
              <span key={value.name} className="gql-enum-chip">
                {value.name}
              </span>
            ))}
          </div>
        ) : null}
        {moreCount > 0 && (
          <a href={`#${slugify(type.name)}`} className="gql-field-enum-more">
            Show more
          </a>
        )}
      </div>
    );
  }

  // 6. OBJECT / INTERFACE / INPUT_OBJECT
  if (type.kind === 'OBJECT' || type.kind === 'INTERFACE' || type.kind === 'INPUT_OBJECT') {
    return (
      <div className="gql-type-block">
        <div className="gql-type-heading">
          {labelPrefix}
          <span className="gql-type">{type.name}</span>
          {labelSuffix}
        </div>
        {type.fields?.length ? (
          <FieldTable
            fields={type.fields}
            depth={depth}
            maxDepth={maxDepth}
            defaultExpandedLevels={defaultExpandedLevels}
          />
        ) : (
          <span className="gql-no-desc">No fields</span>
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
            <span className="gql-type">{renderInlineType(t)}</span>
          </React.Fragment>
        ))}
      </div>
    );
  }

  // Fallback
  return <span style={{ color: 'red' }}>Unknown Type Kind</span>;
});
