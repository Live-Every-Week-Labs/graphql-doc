import React, { useState } from 'react';
import { ExpandedField } from '../../core/transformer/types';
import { TypeViewer } from './TypeViewer';

interface FieldTableProps {
  fields: ExpandedField[];
  depth?: number;
  maxDepth?: number;
  defaultExpandedLevels?: number;
}

export const FieldTable = React.memo(function FieldTable({
  fields,
  depth = 0,
  maxDepth = 10,
  defaultExpandedLevels = 2,
}: FieldTableProps) {
  if (!fields || fields.length === 0) {
    return null;
  }

  return (
    <div className="gql-field-table">
      <div className="gql-field-table-header">
        <div className="gql-table-cell gql-cell-name">Field</div>
        <div className="gql-table-cell gql-cell-type">Type</div>
        <div className="gql-table-cell gql-cell-desc">Description</div>
      </div>
      <div className="gql-field-table-body">
        {fields.map((field) => (
          <div key={field.name} className="gql-table-row">
            <div className="gql-table-cell gql-cell-name">
              <span className={`gql-field-name ${field.isDeprecated ? 'gql-deprecated-name' : ''}`}>
                {field.name}
              </span>
              {field.isRequired && (
                <span className="gql-required" title="Required">
                  *
                </span>
              )}
              {field.isDeprecated && (
                <div className="gql-badge gql-badge-warning" title={field.deprecationReason}>
                  Deprecated
                </div>
              )}
            </div>
            <div className="gql-table-cell gql-cell-type">
              <TypeViewer
                type={field.type}
                depth={depth}
                maxDepth={maxDepth}
                defaultExpandedLevels={defaultExpandedLevels}
                path={`field.${field.name}`}
              />
            </div>
            <div className="gql-table-cell gql-cell-desc">
              <div className="gql-description-text">
                {field.description || <span className="gql-no-desc">-</span>}
              </div>
              {field.args && field.args.length > 0 && (
                <div className="gql-field-args">
                  <div className="gql-args-label">Arguments:</div>
                  <ul className="gql-args-list">
                    {field.args.map((arg) => (
                      <li key={arg.name}>
                        <span className="gql-arg-name">{arg.name}</span>:
                        <TypeViewer
                          type={arg.type}
                          depth={depth + 1}
                          maxDepth={maxDepth}
                          defaultExpandedLevels={defaultExpandedLevels}
                          path={`field.${field.name}.arg.${arg.name}`}
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
