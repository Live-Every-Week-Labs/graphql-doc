import { describe, it, expect } from 'vitest';
import { ExampleFile } from '../metadata/types.js';
import {
  OperationCoverageTarget,
  validateOperationExampleCoverage,
} from './operation-example-validator.js';

function createOperation(
  name: string,
  directives: OperationCoverageTarget['directives'] = {}
): OperationCoverageTarget {
  return {
    name,
    directives,
  };
}

describe('validateOperationExampleCoverage', () => {
  it('passes when documented operations have at least one example', () => {
    const operations: OperationCoverageTarget[] = [
      createOperation('getUser'),
      createOperation('listUsers'),
    ];
    const exampleFiles: ExampleFile[] = [
      {
        operation: 'getUser',
        operationType: 'query',
        examples: [
          { name: 'Get', query: 'query { getUser }', response: { type: 'success', body: {} } },
        ],
      },
      {
        operation: 'listUsers',
        operationType: 'query',
        examples: [
          { name: 'List', query: 'query { listUsers }', response: { type: 'success', body: {} } },
        ],
      },
    ];

    const errors = validateOperationExampleCoverage(operations, exampleFiles);
    expect(errors).toHaveLength(0);
  });

  it('fails when a documented operation has no examples', () => {
    const operations: OperationCoverageTarget[] = [
      createOperation('getUser'),
      createOperation('listUsers'),
    ];
    const exampleFiles: ExampleFile[] = [
      {
        operation: 'getUser',
        operationType: 'query',
        examples: [
          { name: 'Get', query: 'query { getUser }', response: { type: 'success', body: {} } },
        ],
      },
    ];

    const errors = validateOperationExampleCoverage(operations, exampleFiles, {
      examplesLocation: 'docs-metadata/examples/**/*.json',
    });

    expect(errors).toHaveLength(1);
    expect(errors[0].code).toBe('MISSING_OPERATION_EXAMPLE');
    expect(errors[0].file).toBe('docs-metadata/examples/**/*.json');
    expect(errors[0].message).toContain('listUsers');
  });

  it('ignores operations marked with @docIgnore', () => {
    const operations: OperationCoverageTarget[] = [
      createOperation('publicOperation'),
      createOperation('internalOperation', { docIgnore: true }),
    ];
    const exampleFiles: ExampleFile[] = [
      {
        operation: 'publicOperation',
        operationType: 'query',
        examples: [
          {
            name: 'Public',
            query: 'query { publicOperation }',
            response: { type: 'success', body: {} },
          },
        ],
      },
    ];

    const errors = validateOperationExampleCoverage(operations, exampleFiles);
    expect(errors).toHaveLength(0);
  });

  it('ignores operations in excluded doc groups', () => {
    const operations: OperationCoverageTarget[] = [
      createOperation('publicOperation'),
      createOperation('internalOperation', { docGroup: { name: 'Internal' } }),
    ];
    const exampleFiles: ExampleFile[] = [
      {
        operation: 'publicOperation',
        operationType: 'query',
        examples: [
          {
            name: 'Public',
            query: 'query { publicOperation }',
            response: { type: 'success', body: {} },
          },
        ],
      },
    ];

    const errors = validateOperationExampleCoverage(operations, exampleFiles, {
      excludeDocGroups: ['Internal'],
    });
    expect(errors).toHaveLength(0);
  });

  it('treats empty example arrays as missing examples', () => {
    const operations: OperationCoverageTarget[] = [createOperation('getUser')];
    const exampleFiles: ExampleFile[] = [
      {
        operation: 'getUser',
        operationType: 'query',
        examples: [],
      },
    ];

    const errors = validateOperationExampleCoverage(operations, exampleFiles);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('getUser');
  });
});
