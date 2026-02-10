import { describe, it, expect } from 'vitest';
import { mergeMetadata } from './metadata-merger.js';
import { Operation as BaseOperation } from '../parser/types.js';
import { ExampleFile } from '../metadata/types.js';

describe('mergeMetadata', () => {
  const mockBaseOp: BaseOperation = {
    name: 'getUser',
    operationType: 'query',
    arguments: [],
    returnType: 'User',
    directives: {},
    referencedTypes: [],
    isDeprecated: false,
  };

  it('should merge examples into operation', () => {
    const exampleFiles: ExampleFile[] = [
      {
        operation: 'getUser',
        operationType: 'query',
        examples: [
          {
            name: 'Success',
            query: 'query { ... }',
            response: { type: 'success', httpStatus: 200, body: {} },
          },
        ],
      },
    ];

    const result = mergeMetadata([mockBaseOp], exampleFiles);
    expect(result[0].examples).toHaveLength(1);
    expect(result[0].examples[0].name).toBe('Success');
  });
});
