import React from 'react';
import { ExpandedType } from '../../core/transformer/types';
import { slugify } from '../../core/utils/string-utils';
import { FieldTable } from './FieldTable';
import { useTypeRegistry } from '../context/TypeRegistryProvider';

interface TypeViewerProps {
  type: ExpandedType;
  typeLinkBase?: string;
  depth?: number;
  defaultExpandedLevels?: number;
  maxDepth?: number;
  path?: string; // Unique path for expansion tracking
  labelPrefix?: string;
  labelSuffix?: string;
}

export const TypeViewer = React.memo(function TypeViewer({
  type,
  typeLinkBase,
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

  const registry = useTypeRegistry();
  const typesByName = registry?.typesByName ?? {};

  const unwrapType = (input: ExpandedType) => {
    let current = input;
    let isList = false;

    while (current.kind === 'LIST') {
      isList = true;
      current = current.ofType;
    }

    return { baseType: current, isList };
  };

  const resolveType = (input: ExpandedType): ExpandedType => {
    if (input.kind === 'TYPE_REF') {
      return typesByName[input.name] ?? input;
    }
    return input;
  };

  const getRequiredStyle = (input: ExpandedType): 'label' | 'indicator' =>
    input.kind === 'INPUT_OBJECT' ? 'label' : 'indicator';

  const getTypeDocLink = (name: string, kind?: ExpandedType['kind']) => {
    if (!typeLinkBase) {
      return undefined;
    }
    const base = typeLinkBase.replace(/\/$/, '');
    const slug = slugify(name);
    if (kind === 'ENUM') {
      return `${base}/enums/${slug}`;
    }
    if (kind === 'INPUT_OBJECT') {
      return `${base}/inputs/${slug}`;
    }
    if (
      kind === 'OBJECT' ||
      kind === 'INTERFACE' ||
      kind === 'UNION' ||
      kind === 'SCALAR' ||
      kind === 'TYPE_REF' ||
      kind === 'CIRCULAR_REF'
    ) {
      return `${base}/types/${slug}`;
    }
    return undefined;
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
      case 'TYPE_REF': {
        const resolved = resolveType(input);
        const resolvedName =
          resolved.kind === 'TYPE_REF'
            ? input.name
            : 'name' in resolved
              ? resolved.name
              : input.name;
        const href =
          getTypeDocLink(resolvedName, resolved.kind !== 'TYPE_REF' ? resolved.kind : 'TYPE_REF') ??
          input.link;
        return (
          <a href={href} className="gql-type-link">
            {input.name}
          </a>
        );
      }
      case 'CIRCULAR_REF': {
        const resolved = typesByName[input.ref];
        const href =
          getTypeDocLink(
            resolved && 'name' in resolved ? resolved.name : input.ref,
            resolved ? resolved.kind : 'CIRCULAR_REF'
          ) ?? input.link;
        return (
          <a
            href={href}
            className="gql-type-link gql-circular-ref"
            title={`Circular reference to ${input.ref}`}
          >
            {input.ref} ↩
          </a>
        );
      }
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
  const resolvedType = resolveType(type);

  if (resolvedType.kind === 'SCALAR') {
    return (
      <span className="gql-type font-mono">
        {labelPrefix}
        {resolvedType.name}
        {labelSuffix}
      </span>
    );
  }

  // 2. LIST
  if (resolvedType.kind === 'LIST') {
    const { baseType } = unwrapType(resolvedType);
    const resolvedBaseType = resolveType(baseType);
    if (
      resolvedBaseType.kind === 'OBJECT' ||
      resolvedBaseType.kind === 'INTERFACE' ||
      resolvedBaseType.kind === 'INPUT_OBJECT'
    ) {
      return (
        <div className="gql-type-block">
          <div className="gql-type-heading">
            {labelPrefix}
            <span className="gql-type-collection">Array</span>
            <span className="gql-type">{resolvedBaseType.name}</span>
            {labelSuffix}
          </div>
          {resolvedBaseType.fields?.length ? (
            <FieldTable
              fields={resolvedBaseType.fields}
              typeLinkBase={typeLinkBase}
              requiredStyle={getRequiredStyle(resolvedBaseType)}
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

    return <span className="gql-type font-mono">{renderInlineType(resolvedType)}</span>;
  }

  // 3. CIRCULAR_REF
  if (resolvedType.kind === 'CIRCULAR_REF') {
    const href = getTypeDocLink(resolvedType.ref, 'CIRCULAR_REF') ?? resolvedType.link;
    return (
      <span className="gql-type">
        {labelPrefix}
        <a
          href={href}
          className="gql-type-link gql-circular-ref"
          title={`Circular reference to ${resolvedType.ref}`}
        >
          {resolvedType.ref} ↩
        </a>
        {labelSuffix}
      </span>
    );
  }

  // 4. TYPE_REF
  if (resolvedType.kind === 'TYPE_REF') {
    const href = getTypeDocLink(resolvedType.name, 'TYPE_REF') ?? resolvedType.link;
    return (
      <span className="gql-type">
        {labelPrefix}
        <a href={href} className="gql-type-link">
          {resolvedType.name}
        </a>
        {labelSuffix}
      </span>
    );
  }

  // 5. ENUM
  if (resolvedType.kind === 'ENUM') {
    const moreCount = resolvedType.values?.length ? resolvedType.values.length - 25 : 0;
    return (
      <div className="gql-enum-viewer">
        <span className="gql-type">{resolvedType.name}</span>
        <span className="gql-enum-badge">ENUM</span>
        {resolvedType.values?.length ? (
          <div className="gql-enum-values">
            {resolvedType.values.slice(0, 25).map((value) => (
              <span key={value.name} className="gql-enum-chip">
                {value.name}
              </span>
            ))}
          </div>
        ) : null}
        {moreCount > 0 && (
          <a
            href={
              typeLinkBase
                ? `${typeLinkBase.replace(/\/$/, '')}/enums/${slugify(resolvedType.name)}`
                : `#${slugify(resolvedType.name)}`
            }
            className="gql-field-enum-more"
          >
            Show more
          </a>
        )}
      </div>
    );
  }

  // 6. OBJECT / INTERFACE / INPUT_OBJECT
  if (
    resolvedType.kind === 'OBJECT' ||
    resolvedType.kind === 'INTERFACE' ||
    resolvedType.kind === 'INPUT_OBJECT'
  ) {
    return (
      <div className="gql-type-block">
        <div className="gql-type-heading">
          {labelPrefix}
          <span className="gql-type">{resolvedType.name}</span>
          {labelSuffix}
        </div>
        {resolvedType.fields?.length ? (
          <FieldTable
            fields={resolvedType.fields}
            typeLinkBase={typeLinkBase}
            requiredStyle={getRequiredStyle(resolvedType)}
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
  if (resolvedType.kind === 'UNION') {
    return (
      <div className="gql-union-viewer">
        <span className="gql-type-keyword">union</span>
        <span className="gql-type">{resolvedType.name}</span>
        <span className="gql-operator">=</span>
        {resolvedType.possibleTypes.map((t, i) => (
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
