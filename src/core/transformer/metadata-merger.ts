import { Operation as BaseOperation } from '../parser/types.js';
import { ExampleFile, Example } from '../metadata/types.js';
import { operationKey } from '../utils/string-utils.js';

function getOperationTypeIfPresent(exampleFile: ExampleFile): string | undefined {
  const raw = (exampleFile as ExampleFile & { operationType?: unknown }).operationType;
  return typeof raw === 'string' && raw.length > 0 ? raw : undefined;
}

export function mergeMetadata(
  baseOperations: BaseOperation[],
  exampleFiles: ExampleFile[]
): Array<BaseOperation & { examples: Example[] }> {
  // New keying strategy uses operationType + operationName to avoid collisions.
  // Keep a legacy name-only fallback for older example payloads that omit operationType.
  const examplesByOperation = new Map<string, Example[]>();
  const examplesByNameFallback = new Map<string, Example[]>();

  for (const file of exampleFiles) {
    const operationType = getOperationTypeIfPresent(file);
    if (operationType) {
      const key = operationKey({
        operationType,
        operationName: file.operation,
      });
      const existing = examplesByOperation.get(key) || [];
      examplesByOperation.set(key, [...existing, ...file.examples]);
      continue;
    }

    const existingFallback = examplesByNameFallback.get(file.operation) || [];
    examplesByNameFallback.set(file.operation, [...existingFallback, ...file.examples]);
  }

  return baseOperations.map((baseOp) => {
    const key = operationKey({
      operationType: baseOp.operationType,
      operationName: baseOp.name,
    });
    const examples = examplesByOperation.get(key) || examplesByNameFallback.get(baseOp.name) || [];

    return {
      ...baseOp,
      examples,
    };
  });
}
