import { describe, it, expect } from 'vitest';
import { mergeMetadata } from './metadata-merger.js';
import { Operation as BaseOperation } from '../parser/types.js';
import { ExampleFile } from '../metadata/types.js';

describe('mergeMetadata', () => {
  const createOperation = (
    name: string,
    operationType: BaseOperation['operationType']
  ): BaseOperation => ({
    name,
    operationType,
    arguments: [],
    returnType: 'User',
    directives: {},
    referencedTypes: [],
    isDeprecated: false,
  });

  it('should merge examples into operation', () => {
    const mockBaseOp = createOperation('getUser', 'query');
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

  it('keys examples by operation type and name to avoid collisions', () => {
    const operations: BaseOperation[] = [
      createOperation('ping', 'query'),
      createOperation('ping', 'mutation'),
    ];
    const exampleFiles: ExampleFile[] = [
      {
        operation: 'ping',
        operationType: 'query',
        examples: [
          { name: 'Query ping', query: 'query { ping }', response: { type: 'success', body: {} } },
        ],
      },
      {
        operation: 'ping',
        operationType: 'mutation',
        examples: [
          {
            name: 'Mutation ping',
            query: 'mutation { ping }',
            response: { type: 'success', body: {} },
          },
        ],
      },
    ];

    const result = mergeMetadata(operations, exampleFiles);
    expect(result[0].examples).toHaveLength(1);
    expect(result[1].examples).toHaveLength(1);
    expect(result[0].examples[0].name).toBe('Query ping');
    expect(result[1].examples[0].name).toBe('Mutation ping');
  });

  it('falls back to name-only matching when operationType is missing in examples', () => {
    const mockBaseOp = createOperation('legacyOp', 'query');
    const legacyExampleFile = {
      operation: 'legacyOp',
      examples: [
        { name: 'Legacy', query: 'query { legacyOp }', response: { type: 'success', body: {} } },
      ],
    } as unknown as ExampleFile;

    const result = mergeMetadata([mockBaseOp], [legacyExampleFile]);
    expect(result[0].examples).toHaveLength(1);
    expect(result[0].examples[0].name).toBe('Legacy');
  });
});
