import React from 'react';
import { ExpandedType, ExpandedField } from '../../core/transformer/types';
import { slugify } from '../../core/utils/string-utils';
import { FieldTable } from './FieldTable';
import { useTypeRegistry } from '../context/TypeRegistryProvider';
import { useOptionalExpansion } from '../context/ExpansionProvider';

interface TypeViewerProps {
  type: ExpandedType;
  typeLinkBase?: string;
  typeLinkMode?: 'none' | 'deep' | 'all';
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
  typeLinkMode = 'none',
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
  const expansion = useOptionalExpansion();
  const isExpanded =
    expansion?.isExpanded ??
    ((_: string, currentDepth: number, levels: number) => currentDepth < levels);
  const toggleExpand = expansion?.toggleExpand ?? (() => {});

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

  const isObjectLike = (input: ExpandedType): input is ExpandedType & { fields: ExpandedField[] } =>
    input.kind === 'OBJECT' || input.kind === 'INTERFACE' || input.kind === 'INPUT_OBJECT';

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

  const renderInlineType = (input: ExpandedType, allowLink: boolean = false): React.ReactNode => {
    switch (input.kind) {
      case 'LIST':
        return (
          <span className="gql-type-list">
            <span className="gql-bracket">[</span>
            {renderInlineType(input.ofType, allowLink)}
            <span className="gql-bracket">]</span>
          </span>
        );
      case 'TYPE_REF': {
        if (allowLink) {
          const resolved = resolveType(input);
          const resolvedName =
            resolved.kind === 'TYPE_REF'
              ? input.name
              : 'name' in resolved
                ? resolved.name
                : input.name;
          const href =
            getTypeDocLink(
              resolvedName,
              resolved.kind !== 'TYPE_REF' ? resolved.kind : 'TYPE_REF'
            ) ?? input.link;
          return (
            <a href={href} className="gql-type-link">
              {input.name}
            </a>
          );
        }
        return <span>{input.name}</span>;
      }
      case 'CIRCULAR_REF': {
        if (allowLink) {
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
        return <span>{input.ref} ↩</span>;
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

  const renderUnionOptions = (unionType: ExpandedType, basePath: string) => {
    if (unionType.kind !== 'UNION') {
      return null;
    }
    const possibleTypes = unionType.possibleTypes ?? [];
    if (possibleTypes.length === 0) {
      return <span className="gql-no-desc">No possible types</span>;
    }

    return (
      <div className="gql-union-options">
        {possibleTypes.map((possible, index) => {
          const resolvedPossible = resolveType(possible);
          const possibleName =
            'name' in resolvedPossible
              ? resolvedPossible.name
              : resolvedPossible.kind === 'CIRCULAR_REF'
                ? resolvedPossible.ref
                : `union_${index}`;
          const childCount = isObjectLike(resolvedPossible)
            ? (resolvedPossible.fields?.length ?? 0)
            : 0;
          const unionDepth = depth + 1;
          const canInlineExpand =
            isObjectLike(resolvedPossible) && childCount > 0 && unionDepth < maxDepth;
          const expanded = canInlineExpand
            ? isExpanded(`${basePath}.union.${possibleName}`, unionDepth, defaultExpandedLevels)
            : false;
          const toggleLabel = expanded
            ? 'Hide properties'
            : `Show ${childCount} ${childCount === 1 ? 'property' : 'properties'}`;
          const allowLink = typeLinkMode === 'all' || (typeLinkMode === 'deep' && !canInlineExpand);
          const typeHref =
            allowLink && 'name' in resolvedPossible
              ? getTypeDocLink(
                  resolvedPossible.name,
                  resolvedPossible.kind === 'TYPE_REF' ? 'TYPE_REF' : resolvedPossible.kind
                )
              : allowLink && resolvedPossible.kind === 'CIRCULAR_REF'
                ? getTypeDocLink(resolvedPossible.ref, 'CIRCULAR_REF')
                : undefined;
          return (
            <div key={possibleName} className="gql-union-option">
              <div className="gql-union-option-header">
                {typeHref ? (
                  <a href={typeHref} className="gql-type-link">
                    {possibleName}
                  </a>
                ) : (
                  <span className="gql-type">{possibleName}</span>
                )}
                {canInlineExpand && (
                  <button
                    type="button"
                    className="gql-field-toggle"
                    onClick={() => toggleExpand(`${basePath}.union.${possibleName}`, expanded)}
                    aria-expanded={expanded}
                  >
                    {toggleLabel}
                  </button>
                )}
                {!canInlineExpand && typeHref && (
                  <a href={typeHref} className="gql-field-link">
                    View {possibleName}
                  </a>
                )}
              </div>
              {canInlineExpand && expanded && isObjectLike(resolvedPossible) && (
                <div className="gql-union-option-body">
                  <FieldTable
                    fields={resolvedPossible.fields}
                    typeLinkBase={typeLinkBase}
                    typeLinkMode={typeLinkMode}
                    requiredStyle={getRequiredStyle(resolvedPossible)}
                    depth={unionDepth}
                    maxDepth={maxDepth}
                    defaultExpandedLevels={defaultExpandedLevels}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
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
      resolvedBaseType.kind === 'INPUT_OBJECT' ||
      resolvedBaseType.kind === 'UNION'
    ) {
      return (
        <div className="gql-type-block">
          <div className="gql-type-heading">
            {labelPrefix}
            <span className="gql-type-collection">Array</span>
            <span className="gql-type">{resolvedBaseType.name}</span>
            {labelSuffix}
            {resolvedBaseType.kind === 'UNION' && (
              <span className="gql-badge gql-badge-union">UNION</span>
            )}
          </div>
          {resolvedBaseType.kind === 'UNION' ? (
            renderUnionOptions(resolvedBaseType, path)
          ) : resolvedBaseType.fields?.length ? (
            <FieldTable
              fields={resolvedBaseType.fields}
              typeLinkBase={typeLinkBase}
              typeLinkMode={typeLinkMode}
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

    return (
      <span className="gql-type font-mono">
        {renderInlineType(resolvedType, typeLinkMode !== 'none')}
      </span>
    );
  }

  // 3. CIRCULAR_REF
  if (resolvedType.kind === 'CIRCULAR_REF') {
    return (
      <span className="gql-type">
        {labelPrefix}
        {typeLinkMode === 'none' ? (
          <span
            className="gql-type-link gql-circular-ref"
            title={`Circular reference to ${resolvedType.ref}`}
          >
            {resolvedType.ref} ↩
          </span>
        ) : (
          <a
            href={getTypeDocLink(resolvedType.ref, 'CIRCULAR_REF') ?? resolvedType.link}
            className="gql-type-link gql-circular-ref"
            title={`Circular reference to ${resolvedType.ref}`}
          >
            {resolvedType.ref} ↩
          </a>
        )}
        {labelSuffix}
      </span>
    );
  }

  // 4. TYPE_REF
  if (resolvedType.kind === 'TYPE_REF') {
    return (
      <span className="gql-type">
        {labelPrefix}
        {typeLinkMode === 'none' ? (
          <span className="gql-type-link">{resolvedType.name}</span>
        ) : (
          <a
            href={getTypeDocLink(resolvedType.name, 'TYPE_REF') ?? resolvedType.link}
            className="gql-type-link"
          >
            {resolvedType.name}
          </a>
        )}
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
            typeLinkMode={typeLinkMode}
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
      <div className="gql-type-block">
        <div className="gql-type-heading">
          {labelPrefix}
          <span className="gql-type">{resolvedType.name}</span>
          {labelSuffix}
          <span className="gql-badge gql-badge-union">UNION</span>
        </div>
        {renderUnionOptions(resolvedType, path)}
      </div>
    );
  }

  // Fallback
  return <span style={{ color: 'red' }}>Unknown Type Kind</span>;
});
