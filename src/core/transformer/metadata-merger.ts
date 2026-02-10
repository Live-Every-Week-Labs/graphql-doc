import { Operation as BaseOperation } from '../parser/types.js';
import { ExampleFile, Example } from '../metadata/types.js';

export function mergeMetadata(
  baseOperations: BaseOperation[],
  exampleFiles: ExampleFile[]
): Array<BaseOperation & { examples: Example[] }> {
  // Index examples by operation name
  const examplesByOperation = new Map<string, Example[]>();
  for (const file of exampleFiles) {
    const existing = examplesByOperation.get(file.operation) || [];
    examplesByOperation.set(file.operation, [...existing, ...file.examples]);
  }

  return baseOperations.map((baseOp) => {
    const examples = examplesByOperation.get(baseOp.name) || [];

    return {
      ...baseOp,
      examples,
    };
  });
}
