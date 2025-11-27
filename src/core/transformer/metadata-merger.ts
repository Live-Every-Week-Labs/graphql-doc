import { Operation as BaseOperation } from '../parser/types';
import { ExampleFile, ErrorFile, Example, ErrorDefinition } from '../metadata/types';
import { Operation } from './types';

export function mergeMetadata(
  baseOperations: BaseOperation[],
  exampleFiles: ExampleFile[],
  errorFiles: ErrorFile[]
): Operation[] {
  // Index examples by operation name
  const examplesByOperation = new Map<string, Example[]>();
  for (const file of exampleFiles) {
    const existing = examplesByOperation.get(file.operation) || [];
    examplesByOperation.set(file.operation, [...existing, ...file.examples]);
  }

  // Index errors by operation name
  // Error files can apply to multiple operations or all ('*')
  const errorsByOperation = new Map<string, ErrorDefinition[]>();
  const globalErrors: ErrorDefinition[] = [];

  for (const file of errorFiles) {
    if (file.operations.includes('*')) {
      globalErrors.push(...file.errors);
    }

    for (const opName of file.operations) {
      if (opName === '*') continue;
      const existing = errorsByOperation.get(opName) || [];
      errorsByOperation.set(opName, [...existing, ...file.errors]);
    }
  }

  return baseOperations.map((baseOp) => {
    const examples = examplesByOperation.get(baseOp.name) || [];
    const specificErrors = errorsByOperation.get(baseOp.name) || [];
    const errors = [...globalErrors, ...specificErrors];

    return {
      ...baseOp,
      examples,
      errors,
    };
  });
}
