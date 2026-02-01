import React from 'react';
import type { ExpandedField } from '../../core/transformer/types';
import { PropertyTable } from './PropertyTable';

interface FieldTableProps {
  fields: ExpandedField[];
  requiredStyle?: 'label' | 'indicator';
  typeLinkBase?: string;
  typeLinkMode?: 'none' | 'deep' | 'all';
  depth?: number;
  maxDepth?: number;
  defaultExpandedLevels?: number;
}

export const FieldTable = React.memo(function FieldTable({
  fields,
  requiredStyle,
  typeLinkBase,
  typeLinkMode,
  depth = 0,
  maxDepth = 5,
  defaultExpandedLevels = 0,
}: FieldTableProps) {
  return (
    <PropertyTable
      properties={fields}
      variant="fields"
      requiredStyle={requiredStyle}
      typeLinkBase={typeLinkBase}
      typeLinkMode={typeLinkMode}
      depth={depth}
      maxDepth={maxDepth}
      defaultExpandedLevels={defaultExpandedLevels}
    />
  );
});
