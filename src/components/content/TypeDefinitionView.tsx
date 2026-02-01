import React from 'react';
import { ExpandedEnum, ExpandedType } from '../../core/transformer/types';
import { slugify } from '../../core/utils/string-utils';
import { FieldTable } from './FieldTable';
import { EnumDefinitionView } from './EnumDefinitionView';
import { ExpansionProvider } from '../context/ExpansionProvider';
import { TypeRegistryProvider } from '../context/TypeRegistryProvider';

interface TypeDefinitionViewProps {
  type: ExpandedType;
  typeLinkBase?: string;
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  typesByName?: Record<string, ExpandedType>;
  typeLinkMode?: 'none' | 'deep' | 'all';
  defaultExpandedLevels?: number;
  maxDepth?: number;
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

const getKindLabel = (type: ExpandedType) => {
  switch (type.kind) {
    case 'INPUT_OBJECT':
      return 'INPUT';
    case 'OBJECT':
      return 'TYPE';
    case 'INTERFACE':
      return 'INTERFACE';
    case 'UNION':
      return 'UNION';
    case 'ENUM':
      return 'ENUM';
    case 'SCALAR':
      return 'SCALAR';
    default:
      return 'TYPE';
  }
};

const renderInlineType = (
  input: ExpandedType,
  typeLinkBase?: string,
  typeLinkMode: 'none' | 'deep' | 'all' = 'none',
  forceLink: boolean = false
): React.ReactNode => {
  switch (input.kind) {
    case 'LIST':
      return (
        <span className="gql-type-list">
          <span className="gql-bracket">[</span>
          {renderInlineType(input.ofType, typeLinkBase, typeLinkMode, forceLink)}
          <span className="gql-bracket">]</span>
        </span>
      );
    case 'TYPE_REF':
      if (typeLinkMode === 'none' && !forceLink) {
        return <span className="gql-type">{input.name}</span>;
      }
      return (
        <a
          href={
            typeLinkBase
              ? `${typeLinkBase.replace(/\/$/, '')}/types/${slugify(input.name)}`
              : input.link
          }
          className="gql-type-link"
        >
          {input.name}
        </a>
      );
    case 'CIRCULAR_REF':
      if (typeLinkMode === 'none' && !forceLink) {
        return <span className="gql-type">{input.ref} ↩</span>;
      }
      return (
        <a
          href={
            typeLinkBase
              ? `${typeLinkBase.replace(/\/$/, '')}/types/${slugify(input.ref)}`
              : input.link
          }
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
      return <span className="gql-type">{input.name}</span>;
    default:
      return <span>Unknown</span>;
  }
};

export const TypeDefinitionView = React.memo(function TypeDefinitionView({
  type,
  typeLinkBase,
  headingLevel = 2,
  typesByName,
  typeLinkMode = 'none',
  defaultExpandedLevels = 0,
  maxDepth = 5,
  children,
}: TypeDefinitionViewProps) {
  if (!type) return null;

  const HeadingTag = `h${Math.min(6, Math.max(1, headingLevel))}` as keyof JSX.IntrinsicElements;
  const typeName = 'name' in type ? type.name : type.kind === 'CIRCULAR_REF' ? type.ref : 'Type';
  const slug = slugify(typeName);
  const kindLabel = getKindLabel(type);
  const description = 'description' in type ? type.description : undefined;

  return (
    <TypeRegistryProvider typesByName={typesByName}>
      <ExpansionProvider>
        <section className="gql-type-definition" data-type={typeName}>
          <header className="gql-type-definition-header">
            <div className="gql-type-definition-title-row">
              <HeadingTag id={slug} className="gql-type-definition-title">
                {typeName}
              </HeadingTag>
              <span className="gql-badge gql-badge-neutral gql-type-kind">{kindLabel}</span>
            </div>
            {(children || description) && (
              <div className="gql-type-definition-description">
                {children ? children : renderDescription(description)}
              </div>
            )}
          </header>

          {type.kind === 'ENUM' && <EnumDefinitionView enumType={type as ExpandedEnum} />}

          {(type.kind === 'OBJECT' ||
            type.kind === 'INTERFACE' ||
            type.kind === 'INPUT_OBJECT') && (
            <div className="gql-type-definition-section">
              <h3 className="gql-section-title">Fields</h3>
              {type.fields?.length ? (
                <FieldTable
                  fields={type.fields}
                  requiredStyle={type.kind === 'INPUT_OBJECT' ? 'label' : 'indicator'}
                  typeLinkBase={typeLinkBase}
                  typeLinkMode={typeLinkMode}
                  defaultExpandedLevels={defaultExpandedLevels}
                  maxDepth={maxDepth}
                />
              ) : (
                <span className="gql-no-desc">No fields</span>
              )}
            </div>
          )}

          {type.kind === 'UNION' && (
            <div className="gql-type-definition-section">
              <h3 className="gql-section-title">Possible Types</h3>
              {type.possibleTypes?.length ? (
                <div className="gql-union-types">
                  {type.possibleTypes.map((possible, index) => (
                    <React.Fragment key={index}>
                      {index > 0 && <span className="gql-operator">|</span>}
                      {renderInlineType(possible, typeLinkBase, typeLinkMode, true)}
                    </React.Fragment>
                  ))}
                </div>
              ) : (
                <span className="gql-no-desc">No possible types</span>
              )}
            </div>
          )}

          {type.kind === 'SCALAR' && (
            <div className="gql-type-definition-section">
              <h3 className="gql-section-title">Scalar</h3>
              <span className="gql-description-text">Scalar type</span>
            </div>
          )}
        </section>
      </ExpansionProvider>
    </TypeRegistryProvider>
  );
});
