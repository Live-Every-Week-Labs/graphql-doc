import { describe, it, expect } from 'vitest';
import { mergeMetadata } from '../../../src/core/transformer/metadata-merger';
import { Operation as BaseOperation } from '../../../src/core/parser/types';
import { ExampleFile, ErrorFile } from '../../../src/core/metadata/types';

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

    const result = mergeMetadata([mockBaseOp], exampleFiles, []);
    expect(result[0].examples).toHaveLength(1);
    expect(result[0].examples[0].name).toBe('Success');
  });

  it('should merge specific errors into operation', () => {
    const errorFiles: ErrorFile[] = [
      {
        category: 'UserErrors',
        operations: ['getUser'],
        errors: [{ code: 'NOT_FOUND', message: 'Not found', description: '...' }],
      },
    ];

    const result = mergeMetadata([mockBaseOp], [], errorFiles);
    expect(result[0].errors).toHaveLength(1);
    expect(result[0].errors[0].code).toBe('NOT_FOUND');
  });

  it('should merge global errors into operation', () => {
    const errorFiles: ErrorFile[] = [
      {
        category: 'GlobalErrors',
        operations: ['*'],
        errors: [{ code: 'SERVER_ERROR', message: 'Error', description: '...' }],
      },
    ];

    const result = mergeMetadata([mockBaseOp], [], errorFiles);
    expect(result[0].errors).toHaveLength(1);
    expect(result[0].errors[0].code).toBe('SERVER_ERROR');
  });

  it('should combine global and specific errors', () => {
    const errorFiles: ErrorFile[] = [
      {
        category: 'GlobalErrors',
        operations: ['*'],
        errors: [{ code: 'GLOBAL', message: 'Global', description: '...' }],
      },
      {
        category: 'SpecificErrors',
        operations: ['getUser'],
        errors: [{ code: 'SPECIFIC', message: 'Specific', description: '...' }],
      },
    ];

    const result = mergeMetadata([mockBaseOp], [], errorFiles);
    expect(result[0].errors).toHaveLength(2);
    expect(result[0].errors.map((e) => e.code)).toContain('GLOBAL');
    expect(result[0].errors.map((e) => e.code)).toContain('SPECIFIC');
  });
});
