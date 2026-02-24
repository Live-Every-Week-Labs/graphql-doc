import { describe, it, expect } from 'vitest';
import { ExampleFile } from '../metadata/types.js';
import {
  OperationCoverageTarget,
  validateOperationExampleCoverage,
} from './operation-example-validator.js';

function createOperation(
  name: string,
  directives: OperationCoverageTarget['directives'] = {},
  operationType: OperationCoverageTarget['operationType'] = 'query'
): OperationCoverageTarget {
  return {
    name,
    operationType,
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

  it('uses operation type + name when operations share the same name', () => {
    const operations: OperationCoverageTarget[] = [
      createOperation('ping', {}, 'query'),
      createOperation('ping', {}, 'mutation'),
    ];
    const exampleFiles: ExampleFile[] = [
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

    const errors = validateOperationExampleCoverage(operations, exampleFiles);
    expect(errors).toHaveLength(1);
  });

  it('falls back to name-based matching when operation type is unavailable', () => {
    const operations: OperationCoverageTarget[] = [
      {
        name: 'legacyOperation',
        directives: {},
      },
    ];
    const exampleFiles: ExampleFile[] = [
      {
        operation: 'legacyOperation',
        operationType: 'query',
        examples: [
          {
            name: 'Legacy example',
            query: 'query { legacyOperation }',
            response: { type: 'success', body: {} },
          },
        ],
      },
    ];

    const errors = validateOperationExampleCoverage(operations, exampleFiles);
    expect(errors).toHaveLength(0);
  });
});
