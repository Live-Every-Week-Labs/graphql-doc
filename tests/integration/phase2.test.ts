import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { loadExamples } from '../../src/core/metadata/example-loader';
import { loadErrors } from '../../src/core/metadata/error-loader';
import { mergeMetadata } from '../../src/core/transformer/metadata-merger';
import { Operation as BaseOperation } from '../../src/core/parser/types';

const TEST_DIR = path.join(__dirname, 'temp-phase2-test');
const EXAMPLES_DIR = path.join(TEST_DIR, 'examples');
const ERRORS_DIR = path.join(TEST_DIR, 'errors');

describe('Phase 2 Integration', () => {
  beforeAll(async () => {
    await fs.ensureDir(EXAMPLES_DIR);
    await fs.ensureDir(ERRORS_DIR);

    // Create example file
    await fs.writeJson(path.join(EXAMPLES_DIR, 'user-example.json'), {
      operation: 'getUser',
      operationType: 'query',
      examples: [
        {
          name: 'Success',
          query: 'query { ... }',
          response: { type: 'success', httpStatus: 200, body: {} },
        },
      ],
    });

    // Create error file
    await fs.writeJson(path.join(ERRORS_DIR, 'errors.json'), {
      category: 'UserErrors',
      operations: ['getUser'],
      errors: [{ code: 'NOT_FOUND', message: 'Not found', description: '...' }],
    });
  });

  afterAll(async () => {
    await fs.remove(TEST_DIR);
  });

  it('should load and merge metadata correctly', async () => {
    const baseOps: BaseOperation[] = [
      {
        name: 'getUser',
        operationType: 'query',
        arguments: [],
        returnType: 'User',
        directives: {},
        referencedTypes: [],
        isDeprecated: false,
      },
    ];

    const examples = await loadExamples(path.join(EXAMPLES_DIR, '*.json'));
    const errors = await loadErrors(path.join(ERRORS_DIR, '*.json'));

    const merged = mergeMetadata(baseOps, examples, errors);

    expect(merged).toHaveLength(1);
    expect(merged[0].name).toBe('getUser');
    expect(merged[0].examples).toHaveLength(1);
    expect(merged[0].examples[0].name).toBe('Success');
    expect(merged[0].errors).toHaveLength(1);
    expect(merged[0].errors[0].code).toBe('NOT_FOUND');
  });
});
