import { ExampleFile } from '../metadata/types.js';
import { ValidationError } from './types.js';
import { DEFAULT_GROUP_NAME } from '../utils/index.js';

interface OperationExampleCoverageOptions {
  excludeDocGroups?: string[];
  examplesLocation?: string;
}

export interface OperationCoverageTarget {
  name: string;
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
  for (const entry of exampleFiles) {
    const currentCount = exampleCountByOperation.get(entry.operation) ?? 0;
    exampleCountByOperation.set(entry.operation, currentCount + entry.examples.length);
  }

  for (const operation of operations) {
    if (!isOperationDocumented(operation, excludedDocGroups)) {
      continue;
    }

    const exampleCount = exampleCountByOperation.get(operation.name) ?? 0;
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
