import React from 'react';
import type { ExpandedField } from '../../core/transformer/types';
import { PropertyTable } from './PropertyTable';

interface FieldTableProps {
  fields: ExpandedField[];
  depth?: number;
  maxDepth?: number;
  defaultExpandedLevels?: number;
}

export const FieldTable = React.memo(function FieldTable({
  fields,
  depth = 0,
  maxDepth = 3,
  defaultExpandedLevels = 0,
}: FieldTableProps) {
  return (
    <PropertyTable
      properties={fields}
      variant="fields"
      depth={depth}
      maxDepth={maxDepth}
      defaultExpandedLevels={defaultExpandedLevels}
    />
  );
});
