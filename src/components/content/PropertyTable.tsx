import React from 'react';
import { ExpandedField, ExpandedArgument } from '../../core/transformer/types';
import { TypeViewer } from './TypeViewer';

// Type guard to check if property is a field (has args and deprecation)
function isField(prop: ExpandedField | ExpandedArgument): prop is ExpandedField {
  return 'isDeprecated' in prop;
}

// Type guard to check if property is an argument (absence of field-only flags)
function isArgument(prop: ExpandedField | ExpandedArgument): prop is ExpandedArgument {
  return !('isDeprecated' in prop);
}

type PropertyTableVariant = 'fields' | 'arguments';

interface PropertyTableProps {
  properties: (ExpandedField | ExpandedArgument)[];
  variant: PropertyTableVariant;
  depth?: number;
  maxDepth?: number;
  defaultExpandedLevels?: number;
}

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

export const PropertyTable = React.memo(function PropertyTable({
  properties,
  variant,
  depth = 0,
  maxDepth = 10,
  defaultExpandedLevels = 2,
}: PropertyTableProps) {
  if (!properties || properties.length === 0) {
    return null;
  }

  return (
    <div className="gql-field-table">
      <div className="gql-field-table-header">
        <div className="gql-table-cell gql-cell-name">Name</div>
        <div className="gql-table-cell gql-cell-type">Type</div>
        {variant === 'arguments' && <div className="gql-table-cell gql-cell-default">Default</div>}
        <div className="gql-table-cell gql-cell-desc">Description</div>
      </div>
      <div className="gql-field-table-body">
        {properties.map((prop) => (
          <div key={prop.name} className="gql-table-row">
            <div className="gql-table-cell gql-cell-name">
              <span
                className={`gql-field-name ${
                  isField(prop) && prop.isDeprecated ? 'gql-deprecated-name' : ''
                }`}
              >
                {prop.name}
              </span>
              {prop.isRequired && (
                <span className="gql-required" title="Required">
                  *
                </span>
              )}
              {isField(prop) && prop.isDeprecated && (
                <div className="gql-badge gql-badge-warning" title={prop.deprecationReason}>
                  Deprecated
                </div>
              )}
            </div>
            <div className="gql-table-cell gql-cell-type">
              <TypeViewer
                type={prop.type}
                depth={depth}
                maxDepth={maxDepth}
                defaultExpandedLevels={defaultExpandedLevels}
                path={`prop.${prop.name}`}
              />
            </div>
            {variant === 'arguments' && (
              <div className="gql-table-cell gql-cell-default">
                <code className="gql-default-code">
                  {isArgument(prop) ? formatInlineValue(prop.defaultValue) : '-'}
                </code>
              </div>
            )}
            <div className="gql-table-cell gql-cell-desc">
              <div className="gql-description-text">
                {prop.description || <span className="gql-no-desc">-</span>}
              </div>
              {variant === 'fields' && isField(prop) && prop.args && prop.args.length > 0 && (
                <div className="gql-field-args">
                  <div className="gql-args-label">Arguments:</div>
                  <ul className="gql-args-list">
                    {prop.args.map((arg) => (
                      <li key={arg.name}>
                        <span className="gql-arg-name">{arg.name}</span>:
                        <TypeViewer
                          type={arg.type}
                          depth={depth + 1}
                          maxDepth={maxDepth}
                          defaultExpandedLevels={defaultExpandedLevels}
                          path={`prop.${prop.name}.arg.${arg.name}`}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
