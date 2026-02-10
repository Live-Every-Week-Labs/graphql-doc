/**
 * Utility functions for working with the DocModel structure.
 *
 * These helpers flatten, index, and categorise the documentation model
 * so that adapters and generators don't need to duplicate the same
 * traversal logic.
 */

import { DocModel, ExpandedType, Operation } from '../transformer/types.js';

/**
 * Flatten all operations by iterating through every section and subsection.
 * Accepts either a full DocModel or a plain object with a `sections` array.
 */
export function collectOperations(model: { sections: DocModel['sections'] }): Operation[] {
  const operations: Operation[] = [];
  for (const section of model.sections) {
    for (const subsection of section.subsections) {
      operations.push(...subsection.operations);
    }
  }
  return operations;
}

/**
 * Build a two-level lookup of operations keyed first by operation type
 * (query, mutation, subscription) and then by operation name.
 */
export function buildOperationsByType(
  model: DocModel
): Record<Operation['operationType'], Record<string, Operation>> {
  const operationsByType: Record<Operation['operationType'], Record<string, Operation>> = {
    query: {},
    mutation: {},
    subscription: {},
  };

  for (const section of model.sections) {
    for (const subsection of section.subsections) {
      for (const operation of subsection.operations) {
        operationsByType[operation.operationType][operation.name] = operation;
      }
    }
  }

  return operationsByType;
}

/**
 * Build a flat lookup of expanded types keyed by type name.
 */
export function buildTypesByName(types: ExpandedType[]): Record<string, ExpandedType> {
  const typesByName: Record<string, ExpandedType> = {};

  for (const type of types) {
    if ('name' in type && typeof type.name === 'string') {
      typesByName[type.name] = type;
    }
  }

  return typesByName;
}

/**
 * Split an array of expanded types into three sorted categories:
 * enums, input objects, and all other named object-like types
 * (OBJECT, INTERFACE, UNION, SCALAR).
 *
 * Each category is sorted alphabetically by type name.
 */
export function groupTypes(types: ExpandedType[]): {
  enums: ExpandedType[];
  inputs: ExpandedType[];
  types: ExpandedType[];
} {
  const enums: ExpandedType[] = [];
  const inputs: ExpandedType[] = [];
  const objectTypes: ExpandedType[] = [];

  for (const type of types) {
    if (!('name' in type)) {
      continue;
    }
    if (type.kind === 'ENUM') {
      enums.push(type);
    } else if (type.kind === 'INPUT_OBJECT') {
      inputs.push(type);
    } else if (
      type.kind === 'OBJECT' ||
      type.kind === 'INTERFACE' ||
      type.kind === 'UNION' ||
      type.kind === 'SCALAR'
    ) {
      objectTypes.push(type);
    }
  }

  const byName = (a: ExpandedType, b: ExpandedType) =>
    (a as { name: string }).name.localeCompare((b as { name: string }).name);

  return {
    enums: enums.sort(byName),
    inputs: inputs.sort(byName),
    types: objectTypes.sort(byName),
  };
}
