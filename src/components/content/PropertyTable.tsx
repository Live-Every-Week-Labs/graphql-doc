import React from 'react';
import { ExpandedField, ExpandedArgument, ExpandedType } from '../../core/transformer/types';
import { useExpansion } from '../context/ExpansionProvider';
import { useTypeRegistry } from '../context/TypeRegistryProvider';
import { slugify } from '../../core/utils/string-utils';

// Type guard to check if property is a field (has args and deprecation)
function isField(prop: ExpandedField | ExpandedArgument): prop is ExpandedField {
  return 'isDeprecated' in prop;
}

// Type guard to check if property is an argument (absence of field-only flags)
function isArgument(prop: ExpandedField | ExpandedArgument): prop is ExpandedArgument {
  return !('isDeprecated' in prop);
}

type PropertyTableVariant = 'fields' | 'arguments';
type RequiredStyle = 'label' | 'indicator';

interface PropertyTableProps {
  properties: (ExpandedField | ExpandedArgument)[];
  variant: PropertyTableVariant;
  requiredStyle?: RequiredStyle;
  typeLinkBase?: string;
  depth?: number;
  maxDepth?: number;
  defaultExpandedLevels?: number;
  pathPrefix?: string;
}

const MAX_INLINE_DEPTH = 3;
const MAX_ENUM_VALUES = 25;

const formatInlineValue = (value: unknown) => {
  if (value === undefined) {
    return '-';
  }
  if (typeof value === 'string') {
    return JSON.stringify(value);
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const unwrapType = (type: ExpandedType) => {
  let current = type;
  let isList = false;

  while (current.kind === 'LIST') {
    isList = true;
    current = current.ofType;
  }

  return { baseType: current, isList };
};

const isObjectLike = (type: ExpandedType): type is ExpandedType & { fields: ExpandedField[] } =>
  type.kind === 'OBJECT' || type.kind === 'INTERFACE' || type.kind === 'INPUT_OBJECT';

const getTypeLink = (type: ExpandedType) => {
  if (type.kind === 'TYPE_REF' || type.kind === 'CIRCULAR_REF') {
    return type.link;
  }
  if ('name' in type && type.name) {
    return `#${slugify(type.name)}`;
  }
  if ('ref' in type && type.ref) {
    return `#${slugify(type.ref)}`;
  }
  return undefined;
};

const renderTypeLabel = (
  type: ExpandedType,
  getTypeHref?: (input: ExpandedType) => string | undefined
): React.ReactNode => {
  switch (type.kind) {
    case 'LIST':
      return (
        <span className="gql-type-list">
          <span className="gql-bracket">[</span>
          {renderTypeLabel(type.ofType, getTypeHref)}
          <span className="gql-bracket">]</span>
        </span>
      );
    case 'TYPE_REF':
      return (
        <a
          href={getTypeHref ? (getTypeHref(type) ?? type.link) : type.link}
          className="gql-type-link"
        >
          {type.name}
        </a>
      );
    case 'CIRCULAR_REF':
      return (
        <a
          href={getTypeHref ? (getTypeHref(type) ?? type.link) : type.link}
          className="gql-type-link gql-circular-ref"
          title={`Circular reference to ${type.ref}`}
        >
          {type.ref} ↩
        </a>
      );
    case 'SCALAR':
    case 'ENUM':
    case 'OBJECT':
    case 'INTERFACE':
    case 'INPUT_OBJECT':
    case 'UNION':
      return <span>{type.name}</span>;
    default:
      return <span>Unknown</span>;
  }
};

export const PropertyTable = React.memo(function PropertyTable({
  properties,
  variant,
  requiredStyle: requiredStyleProp,
  typeLinkBase,
  depth = 0,
  maxDepth = MAX_INLINE_DEPTH,
  defaultExpandedLevels = 0,
  pathPrefix = 'prop',
}: PropertyTableProps) {
  if (!properties || properties.length === 0) {
    return null;
  }

  const { isExpanded, toggleExpand } = useExpansion();
  const registry = useTypeRegistry();
  const typesByName = registry?.typesByName ?? {};
  const inlineDepthLimit = Math.min(MAX_INLINE_DEPTH, maxDepth);
  const requiredStyle: RequiredStyle =
    variant === 'arguments' ? 'label' : (requiredStyleProp ?? 'indicator');
  const showNullableSuffix = requiredStyle === 'indicator';
  const normalizedTypeBase = typeLinkBase ? typeLinkBase.replace(/\/$/, '') : undefined;
  const getTypeDocLink = (type: ExpandedType) => {
    const resolved =
      type.kind === 'TYPE_REF'
        ? (typesByName[type.name] ?? type)
        : type.kind === 'CIRCULAR_REF'
          ? (typesByName[type.ref] ?? type)
          : type;
    let resolvedName: string | undefined;
    if ('name' in resolved) {
      resolvedName = resolved.name;
    } else if (resolved.kind === 'CIRCULAR_REF') {
      resolvedName = resolved.ref;
    }

    if (normalizedTypeBase && resolvedName && resolved.kind !== 'TYPE_REF') {
      const slug = slugify(resolvedName);
      if (resolved.kind === 'ENUM') {
        return `${normalizedTypeBase}/enums/${slug}`;
      }
      if (resolved.kind === 'INPUT_OBJECT') {
        return `${normalizedTypeBase}/inputs/${slug}`;
      }
      if (
        resolved.kind === 'OBJECT' ||
        resolved.kind === 'INTERFACE' ||
        resolved.kind === 'UNION' ||
        resolved.kind === 'SCALAR'
      ) {
        return `${normalizedTypeBase}/types/${slug}`;
      }
    }

    if (normalizedTypeBase && type.kind === 'TYPE_REF') {
      const slug = slugify(type.name);
      return `${normalizedTypeBase}/types/${slug}`;
    }
    if (normalizedTypeBase && type.kind === 'CIRCULAR_REF') {
      const slug = slugify(type.ref);
      return `${normalizedTypeBase}/types/${slug}`;
    }
    if (normalizedTypeBase && 'name' in type && type.name) {
      const slug = slugify(type.name);
      if (type.kind === 'ENUM') {
        return `${normalizedTypeBase}/enums/${slug}`;
      }
      if (type.kind === 'INPUT_OBJECT') {
        return `${normalizedTypeBase}/inputs/${slug}`;
      }
      if (
        type.kind === 'OBJECT' ||
        type.kind === 'INTERFACE' ||
        type.kind === 'UNION' ||
        type.kind === 'SCALAR'
      ) {
        return `${normalizedTypeBase}/types/${slug}`;
      }
    }
    return getTypeLink(type);
  };

  const resolveType = (type: ExpandedType): ExpandedType => {
    if (type.kind === 'TYPE_REF') {
      return typesByName[type.name] ?? type;
    }
    return type;
  };

  return (
    <div className="gql-field-list">
      {properties.map((prop) => {
        const { baseType } = unwrapType(prop.type);
        const resolvedBaseType = resolveType(baseType);
        const expandable =
          isObjectLike(resolvedBaseType) &&
          ((resolvedBaseType.fields && resolvedBaseType.fields.length > 0) ||
            resolvedBaseType.isCollapsible);
        const path = `${pathPrefix}.${prop.name}`;
        const expanded = expandable ? isExpanded(path, depth, defaultExpandedLevels) : false;
        const childCount = resolvedBaseType.fields?.length ?? 0;
        const canInlineExpand = expandable && depth < inlineDepthLimit && childCount > 0;
        const toggleLabel = expanded
          ? 'Hide properties'
          : `Show ${childCount} ${childCount === 1 ? 'property' : 'properties'}`;
        const typeLink = expandable ? getTypeDocLink(baseType) : undefined;

        const isEnum =
          resolvedBaseType.kind === 'ENUM' &&
          Array.isArray(resolvedBaseType.values) &&
          resolvedBaseType.values.length > 0;
        const enumValues = isEnum ? resolvedBaseType.values : [];
        const enumVisible = enumValues.slice(0, MAX_ENUM_VALUES);
        const enumMore = enumValues.length - enumVisible.length;
        const enumLink = isEnum ? getTypeDocLink(baseType) : undefined;

        return (
          <div key={prop.name} className="gql-field-item" data-depth={depth}>
            <div className="gql-field-main">
              <div className="gql-field-name-row">
                <span
                  className={`gql-field-name ${
                    isField(prop) && prop.isDeprecated ? 'gql-deprecated-name' : ''
                  }`}
                >
                  {prop.name}
                </span>
                {prop.isRequired && requiredStyle === 'label' && (
                  <span className="gql-required-badge" title="Required">
                    Required
                  </span>
                )}
                {isField(prop) && prop.isDeprecated && (
                  <span className="gql-badge gql-badge-warning" title={prop.deprecationReason}>
                    Deprecated
                  </span>
                )}
              </div>

              <div className="gql-field-meta">
                <span className="gql-field-type gql-type">
                  {showNullableSuffix && !prop.isRequired ? (
                    <span className="gql-type-nullable">
                      {renderTypeLabel(prop.type, getTypeDocLink)}
                      <span className="gql-nullable-text">| null</span>
                    </span>
                  ) : (
                    renderTypeLabel(prop.type, getTypeDocLink)
                  )}
                </span>
                {variant === 'arguments' && isArgument(prop) && prop.defaultValue !== undefined && (
                  <span className="gql-field-default">
                    <span className="gql-field-default-label">Default</span>
                    <code className="gql-default-code">{formatInlineValue(prop.defaultValue)}</code>
                  </span>
                )}
              </div>

              <div className="gql-field-description">
                {prop.description ? (
                  <span className="gql-description-text">{prop.description}</span>
                ) : (
                  <span className="gql-no-desc">-</span>
                )}
              </div>

              {isEnum && (
                <div className="gql-field-enum">
                  <div className="gql-field-enum-label">Values</div>
                  <div className="gql-field-enum-values">
                    {enumVisible.map((value) => (
                      <span key={value.name} className="gql-field-enum-chip">
                        {value.name}
                      </span>
                    ))}
                  </div>
                  {enumMore > 0 && enumLink && (
                    <a href={enumLink} className="gql-field-enum-more">
                      Show more
                    </a>
                  )}
                </div>
              )}

              {variant === 'fields' && isField(prop) && prop.args && prop.args.length > 0 && (
                <div className="gql-field-args">
                  <div className="gql-args-label">Arguments</div>
                  <ul className="gql-args-list">
                    {prop.args.map((arg) => (
                      <li key={arg.name}>
                        <span className="gql-arg-name">{arg.name}</span>
                        <span className="gql-arg-separator">·</span>
                        <span className="gql-arg-type">{renderTypeLabel(arg.type)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {expandable && canInlineExpand && (
              <button
                type="button"
                className="gql-field-toggle"
                onClick={() => toggleExpand(path, expanded)}
                aria-expanded={expanded}
              >
                {toggleLabel}
              </button>
            )}

            {expandable && !canInlineExpand && typeLink && (
              <a href={typeLink} className="gql-field-link">
                View {resolvedBaseType.name}
              </a>
            )}

            {expandable && canInlineExpand && expanded && (
              <div className="gql-field-children">
                <PropertyTable
                  properties={resolvedBaseType.fields}
                  variant="fields"
                  requiredStyle={requiredStyle}
                  typeLinkBase={typeLinkBase}
                  depth={depth + 1}
                  maxDepth={maxDepth}
                  defaultExpandedLevels={defaultExpandedLevels}
                  pathPrefix={path}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});
