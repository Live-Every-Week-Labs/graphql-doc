import { ExampleFile } from '../metadata/types.js';
import { ValidationError } from './types.js';
import { DEFAULT_GROUP_NAME } from '../utils/index.js';
import { operationKey } from '../utils/string-utils.js';

interface OperationExampleCoverageOptions {
  excludeDocGroups?: string[];
  examplesLocation?: string;
}

export interface OperationCoverageTarget {
  name: string;
  operationType?: 'query' | 'mutation' | 'subscription';
  directives: {
    docIgnore?: boolean;
    docGroup?: {
      name?: string;
    };
  };
}

export function isOperationDocumented(
  operation: OperationCoverageTarget,
  excludedDocGroups: Set<string> = new Set()
): boolean {
  if (operation.directives.docIgnore) {
    return false;
  }

  const groupName = operation.directives.docGroup?.name ?? DEFAULT_GROUP_NAME;
  if (excludedDocGroups.has(groupName)) {
    return false;
  }

  return true;
}

export function validateOperationExampleCoverage(
  operations: OperationCoverageTarget[],
  exampleFiles: ExampleFile[],
  options: OperationExampleCoverageOptions = {}
): ValidationError[] {
  const errors: ValidationError[] = [];
  const excludedDocGroups = new Set(options.excludeDocGroups ?? []);
  const examplesLocation = options.examplesLocation ?? 'examples';

  const exampleCountByOperation = new Map<string, number>();
  const exampleCountByName = new Map<string, number>();
  const exampleCountByLegacyName = new Map<string, number>();
  for (const entry of exampleFiles) {
    const nameCount = exampleCountByName.get(entry.operation) ?? 0;
    exampleCountByName.set(entry.operation, nameCount + entry.examples.length);

    const entryOperationType = (
      entry as ExampleFile & { operationType?: OperationCoverageTarget['operationType'] }
    ).operationType;
    if (entryOperationType) {
      const key = operationKey({
        operationType: entryOperationType,
        operationName: entry.operation,
      });
      const typedCount = exampleCountByOperation.get(key) ?? 0;
      exampleCountByOperation.set(key, typedCount + entry.examples.length);
    } else {
      // Backward compatibility for legacy payloads missing operationType.
      const legacyCount = exampleCountByLegacyName.get(entry.operation) ?? 0;
      exampleCountByLegacyName.set(entry.operation, legacyCount + entry.examples.length);
    }
  }

  for (const operation of operations) {
    if (!isOperationDocumented(operation, excludedDocGroups)) {
      continue;
    }

    const exampleCount = operation.operationType
      ? (exampleCountByOperation.get(
          operationKey({
            operationType: operation.operationType,
            operationName: operation.name,
          })
        ) ??
        exampleCountByLegacyName.get(operation.name) ??
        0)
      : (exampleCountByName.get(operation.name) ?? 0);
    if (exampleCount > 0) {
      continue;
    }

    errors.push({
      file: examplesLocation,
      message: `Operation "${operation.name}" is included in docs but has no examples.`,
      severity: 'error',
      code: 'MISSING_OPERATION_EXAMPLE',
    });
  }

  return errors;
}
