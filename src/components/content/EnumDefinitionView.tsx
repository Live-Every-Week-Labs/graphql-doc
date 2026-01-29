import React from 'react';
import { ExpandedEnum } from '../../core/transformer/types';

interface EnumDefinitionViewProps {
  enumType: ExpandedEnum;
}

export const EnumDefinitionView = React.memo(function EnumDefinitionView({
  enumType,
}: EnumDefinitionViewProps) {
  const values = enumType.values ?? [];

  if (values.length === 0) {
    return <div className="gql-enum-definition-empty">No values</div>;
  }

  return (
    <div className="gql-enum-definition">
      {values.map((value) => (
        <div key={value.name} className="gql-enum-definition-item">
          <div className="gql-enum-value-row">
            <span className="gql-enum-value-name">{value.name}</span>
            {value.isDeprecated && (
              <span className="gql-badge gql-badge-warning" title={value.deprecationReason}>
                Deprecated
              </span>
            )}
          </div>
          <div className="gql-enum-value-description">
            {value.description ? (
              <span className="gql-description-text">{value.description}</span>
            ) : (
              <span className="gql-no-desc">-</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
});
