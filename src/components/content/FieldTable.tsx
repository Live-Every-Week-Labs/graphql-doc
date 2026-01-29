import React from 'react';
import type { ExpandedField } from '../../core/transformer/types';
import { PropertyTable } from './PropertyTable';

interface FieldTableProps {
  fields: ExpandedField[];
  requiredStyle?: 'label' | 'indicator';
  depth?: number;
  maxDepth?: number;
  defaultExpandedLevels?: number;
}

export const FieldTable = React.memo(function FieldTable({
  fields,
  requiredStyle,
  depth = 0,
  maxDepth = 3,
  defaultExpandedLevels = 0,
}: FieldTableProps) {
  return (
    <PropertyTable
      properties={fields}
      variant="fields"
      requiredStyle={requiredStyle}
      depth={depth}
      maxDepth={maxDepth}
      defaultExpandedLevels={defaultExpandedLevels}
    />
  );
});
