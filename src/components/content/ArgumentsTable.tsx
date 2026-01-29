import React from 'react';
import type { ExpandedArgument } from '../../core/transformer/types';
import { PropertyTable } from './PropertyTable';

interface ArgumentsTableProps {
  arguments: ExpandedArgument[];
  typeLinkBase?: string;
  typeLinkMode?: 'none' | 'deep' | 'all';
  depth?: number;
  maxDepth?: number;
  defaultExpandedLevels?: number;
}

export const ArgumentsTable = React.memo(function ArgumentsTable({
  arguments: args,
  typeLinkBase,
  typeLinkMode,
  depth = 0,
  maxDepth = 3,
  defaultExpandedLevels = 0,
}: ArgumentsTableProps) {
  return (
    <PropertyTable
      properties={args}
      variant="arguments"
      typeLinkBase={typeLinkBase}
      typeLinkMode={typeLinkMode}
      depth={depth}
      maxDepth={maxDepth}
      defaultExpandedLevels={defaultExpandedLevels}
    />
  );
});
