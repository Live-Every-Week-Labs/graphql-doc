import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { loadExamples } from '../../src/core/metadata/example-loader';
import { mergeMetadata } from '../../src/core/transformer/metadata-merger';
import { Operation as BaseOperation } from '../../src/core/parser/types';

const TEST_DIR = path.join(__dirname, 'temp-phase2-test');
const EXAMPLES_DIR = path.join(TEST_DIR, 'examples');

describe('Phase 2 Integration', () => {
  beforeAll(async () => {
    await fs.ensureDir(EXAMPLES_DIR);

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
    const merged = mergeMetadata(baseOps, examples);

    expect(merged).toHaveLength(1);
    expect(merged[0].name).toBe('getUser');
    expect(merged[0].examples).toHaveLength(1);
    expect(merged[0].examples[0].name).toBe('Success');
  });
});
