import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { MetadataValidator } from './metadata-validator.js';

describe('MetadataValidator', () => {
  let testDir: string;
  let validator: MetadataValidator;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `metadata-validator-test-${Date.now()}`);
    await fs.ensureDir(testDir);
    validator = new MetadataValidator();
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  describe('validateExamples', () => {
    it('passes with valid example files', async () => {
      const examplesDir = path.join(testDir, 'examples');
      await fs.ensureDir(examplesDir);

      await fs.writeJson(path.join(examplesDir, 'get-user.json'), {
        operation: 'getUser',
        operationType: 'query',
        examples: [
          {
            name: 'Basic Example',
            query: 'query GetUser { getUser(id: "1") { id } }',
            response: {
              type: 'success',
              httpStatus: 200,
              body: { data: { getUser: { id: '1' } } },
            },
          },
        ],
      });

      const result = await validator.validateExamples(path.join(examplesDir, '**/*.json'));

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.referencedOperations).toContain('getUser');
    });

    it('passes with multiple valid example files', async () => {
      const examplesDir = path.join(testDir, 'examples');
      await fs.ensureDir(examplesDir);

      await fs.writeJson(path.join(examplesDir, 'get-user.json'), {
        operation: 'getUser',
        operationType: 'query',
        examples: [
          {
            name: 'Example',
            query: 'query { getUser }',
            response: { type: 'success', httpStatus: 200, body: {} },
          },
        ],
      });

      await fs.writeJson(path.join(examplesDir, 'create-user.json'), {
        operation: 'createUser',
        operationType: 'mutation',
        examples: [
          {
            name: 'Example',
            query: 'mutation { createUser }',
            response: { type: 'success', httpStatus: 200, body: {} },
          },
        ],
      });

      const result = await validator.validateExamples(path.join(examplesDir, '**/*.json'));

      expect(result.valid).toBe(true);
      expect(result.referencedOperations).toContain('getUser');
      expect(result.referencedOperations).toContain('createUser');
    });

    it('fails with invalid JSON', async () => {
      const examplesDir = path.join(testDir, 'examples');
      await fs.ensureDir(examplesDir);

      await fs.writeFile(path.join(examplesDir, 'invalid.json'), '{ invalid json }');

      const result = await validator.validateExamples(path.join(examplesDir, '**/*.json'));

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('INVALID_JSON');
    });

    it('fails when missing operation field', async () => {
      const examplesDir = path.join(testDir, 'examples');
      await fs.ensureDir(examplesDir);

      await fs.writeJson(path.join(examplesDir, 'missing-op.json'), {
        operationType: 'query',
        examples: [],
      });

      const result = await validator.validateExamples(path.join(examplesDir, '**/*.json'));

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'MISSING_REQUIRED_FIELD')).toBe(true);
      expect(result.errors.some((e) => e.message.includes('operation'))).toBe(true);
    });

    it('fails when missing operationType field', async () => {
      const examplesDir = path.join(testDir, 'examples');
      await fs.ensureDir(examplesDir);

      await fs.writeJson(path.join(examplesDir, 'missing-type.json'), {
        operation: 'getUser',
        examples: [],
      });

      const result = await validator.validateExamples(path.join(examplesDir, '**/*.json'));

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'MISSING_REQUIRED_FIELD')).toBe(true);
      expect(result.errors.some((e) => e.message.includes('operationType'))).toBe(true);
    });

    it('fails when missing examples array', async () => {
      const examplesDir = path.join(testDir, 'examples');
      await fs.ensureDir(examplesDir);

      await fs.writeJson(path.join(examplesDir, 'missing-examples.json'), {
        operation: 'getUser',
        operationType: 'query',
      });

      const result = await validator.validateExamples(path.join(examplesDir, '**/*.json'));

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'MISSING_REQUIRED_FIELD')).toBe(true);
      expect(result.errors.some((e) => e.message.includes('examples'))).toBe(true);
    });

    it('fails with invalid operationType', async () => {
      const examplesDir = path.join(testDir, 'examples');
      await fs.ensureDir(examplesDir);

      await fs.writeJson(path.join(examplesDir, 'invalid-type.json'), {
        operation: 'getUser',
        operationType: 'invalid',
        examples: [],
      });

      const result = await validator.validateExamples(path.join(examplesDir, '**/*.json'));

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'INVALID_OPERATION_TYPE')).toBe(true);
    });

    it('fails when example missing required name', async () => {
      const examplesDir = path.join(testDir, 'examples');
      await fs.ensureDir(examplesDir);

      await fs.writeJson(path.join(examplesDir, 'missing-name.json'), {
        operation: 'getUser',
        operationType: 'query',
        examples: [
          {
            query: 'query { getUser }',
            response: { type: 'success', httpStatus: 200, body: {} },
          },
        ],
      });

      const result = await validator.validateExamples(path.join(examplesDir, '**/*.json'));

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('name'))).toBe(true);
    });

    it('fails when example missing required query', async () => {
      const examplesDir = path.join(testDir, 'examples');
      await fs.ensureDir(examplesDir);

      await fs.writeJson(path.join(examplesDir, 'missing-query.json'), {
        operation: 'getUser',
        operationType: 'query',
        examples: [
          {
            name: 'Example',
            response: { type: 'success', httpStatus: 200, body: {} },
          },
        ],
      });

      const result = await validator.validateExamples(path.join(examplesDir, '**/*.json'));

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('query'))).toBe(true);
    });

    it('fails when response has invalid type', async () => {
      const examplesDir = path.join(testDir, 'examples');
      await fs.ensureDir(examplesDir);

      await fs.writeJson(path.join(examplesDir, 'invalid-response.json'), {
        operation: 'getUser',
        operationType: 'query',
        examples: [
          {
            name: 'Example',
            query: 'query { getUser }',
            response: { type: 'invalid', httpStatus: 200, body: {} },
          },
        ],
      });

      const result = await validator.validateExamples(path.join(examplesDir, '**/*.json'));

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'INVALID_RESPONSE')).toBe(true);
    });

    it('collects errors from multiple files', async () => {
      const examplesDir = path.join(testDir, 'examples');
      await fs.ensureDir(examplesDir);

      await fs.writeJson(path.join(examplesDir, 'invalid1.json'), {
        operation: 'op1',
        // missing operationType and examples
      });

      await fs.writeJson(path.join(examplesDir, 'invalid2.json'), {
        operationType: 'query',
        // missing operation and examples
      });

      const result = await validator.validateExamples(path.join(examplesDir, '**/*.json'));

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(4);
    });

    it('returns empty result when no files match pattern', async () => {
      const examplesDir = path.join(testDir, 'examples');
      await fs.ensureDir(examplesDir);

      const result = await validator.validateExamples(path.join(examplesDir, '**/*.json'));

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.referencedOperations).toHaveLength(0);
    });

    it('handles nested directories', async () => {
      const queriesDir = path.join(testDir, 'examples', 'queries');
      const mutationsDir = path.join(testDir, 'examples', 'mutations');
      await fs.ensureDir(queriesDir);
      await fs.ensureDir(mutationsDir);

      await fs.writeJson(path.join(queriesDir, 'get-user.json'), {
        operation: 'getUser',
        operationType: 'query',
        examples: [
          {
            name: 'Example',
            query: 'query { getUser }',
            response: { type: 'success', httpStatus: 200, body: {} },
          },
        ],
      });

      await fs.writeJson(path.join(mutationsDir, 'create-user.json'), {
        operation: 'createUser',
        operationType: 'mutation',
        examples: [
          {
            name: 'Example',
            query: 'mutation { createUser }',
            response: { type: 'success', httpStatus: 200, body: {} },
          },
        ],
      });

      const result = await validator.validateExamples(path.join(testDir, 'examples', '**/*.json'));

      expect(result.valid).toBe(true);
      expect(result.referencedOperations).toContain('getUser');
      expect(result.referencedOperations).toContain('createUser');
    });
  });

  describe('validateErrors', () => {
    it('passes with valid error files', async () => {
      const errorsDir = path.join(testDir, 'errors');
      await fs.ensureDir(errorsDir);

      await fs.writeJson(path.join(errorsDir, 'common.json'), {
        category: 'Common',
        operations: ['*'],
        errors: [
          {
            code: 'UNAUTHORIZED',
            message: 'Not authorized',
            description: 'You must be logged in',
          },
        ],
      });

      const result = await validator.validateErrors(path.join(errorsDir, '**/*.json'));

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('extracts non-wildcard operations', async () => {
      const errorsDir = path.join(testDir, 'errors');
      await fs.ensureDir(errorsDir);

      await fs.writeJson(path.join(errorsDir, 'user-errors.json'), {
        category: 'User',
        operations: ['getUser', 'createUser', '*'],
        errors: [
          {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
            description: 'The user does not exist',
          },
        ],
      });

      const result = await validator.validateErrors(path.join(errorsDir, '**/*.json'));

      expect(result.valid).toBe(true);
      expect(result.referencedOperations).toContain('getUser');
      expect(result.referencedOperations).toContain('createUser');
      expect(result.referencedOperations).not.toContain('*');
    });

    it('fails with invalid JSON', async () => {
      const errorsDir = path.join(testDir, 'errors');
      await fs.ensureDir(errorsDir);

      await fs.writeFile(path.join(errorsDir, 'invalid.json'), '{ broken }');

      const result = await validator.validateErrors(path.join(errorsDir, '**/*.json'));

      expect(result.valid).toBe(false);
      expect(result.errors[0].code).toBe('INVALID_JSON');
    });

    it('fails when missing category field', async () => {
      const errorsDir = path.join(testDir, 'errors');
      await fs.ensureDir(errorsDir);

      await fs.writeJson(path.join(errorsDir, 'missing-category.json'), {
        operations: ['*'],
        errors: [],
      });

      const result = await validator.validateErrors(path.join(errorsDir, '**/*.json'));

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('category'))).toBe(true);
    });

    it('fails when missing operations field', async () => {
      const errorsDir = path.join(testDir, 'errors');
      await fs.ensureDir(errorsDir);

      await fs.writeJson(path.join(errorsDir, 'missing-ops.json'), {
        category: 'Common',
        errors: [],
      });

      const result = await validator.validateErrors(path.join(errorsDir, '**/*.json'));

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('operations'))).toBe(true);
    });

    it('fails when missing errors array', async () => {
      const errorsDir = path.join(testDir, 'errors');
      await fs.ensureDir(errorsDir);

      await fs.writeJson(path.join(errorsDir, 'missing-errors.json'), {
        category: 'Common',
        operations: ['*'],
      });

      const result = await validator.validateErrors(path.join(errorsDir, '**/*.json'));

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('errors'))).toBe(true);
    });

    it('fails when error missing required code', async () => {
      const errorsDir = path.join(testDir, 'errors');
      await fs.ensureDir(errorsDir);

      await fs.writeJson(path.join(errorsDir, 'missing-code.json'), {
        category: 'Common',
        operations: ['*'],
        errors: [
          {
            message: 'Error message',
            description: 'Description',
          },
        ],
      });

      const result = await validator.validateErrors(path.join(errorsDir, '**/*.json'));

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('code'))).toBe(true);
    });

    it('fails when error missing required message', async () => {
      const errorsDir = path.join(testDir, 'errors');
      await fs.ensureDir(errorsDir);

      await fs.writeJson(path.join(errorsDir, 'missing-message.json'), {
        category: 'Common',
        operations: ['*'],
        errors: [
          {
            code: 'ERROR_CODE',
            description: 'Description',
          },
        ],
      });

      const result = await validator.validateErrors(path.join(errorsDir, '**/*.json'));

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('message'))).toBe(true);
    });

    it('fails when error missing required description', async () => {
      const errorsDir = path.join(testDir, 'errors');
      await fs.ensureDir(errorsDir);

      await fs.writeJson(path.join(errorsDir, 'missing-desc.json'), {
        category: 'Common',
        operations: ['*'],
        errors: [
          {
            code: 'ERROR_CODE',
            message: 'Error message',
          },
        ],
      });

      const result = await validator.validateErrors(path.join(errorsDir, '**/*.json'));

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('description'))).toBe(true);
    });

    it('passes with optional fields', async () => {
      const errorsDir = path.join(testDir, 'errors');
      await fs.ensureDir(errorsDir);

      await fs.writeJson(path.join(errorsDir, 'with-optional.json'), {
        category: 'Common',
        operations: ['*'],
        errors: [
          {
            code: 'ERROR_CODE',
            message: 'Error message',
            description: 'Description',
            resolution: 'How to fix it',
            type: 'validation',
            httpStatus: 400,
          },
        ],
        commonPatterns: {
          retryable: true,
        },
      });

      const result = await validator.validateErrors(path.join(errorsDir, '**/*.json'));

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('crossValidateOperations', () => {
    it('returns empty array when all operations exist', () => {
      const referencedOps = new Map<string, string[]>();
      referencedOps.set('getUser', ['examples/get-user.json']);
      referencedOps.set('createUser', ['examples/create-user.json']);

      const schemaOps = new Set(['getUser', 'createUser', 'deleteUser']);

      const warnings = validator.crossValidateOperations(referencedOps, schemaOps);

      expect(warnings).toHaveLength(0);
    });

    it('returns warnings for unknown operations', () => {
      const referencedOps = new Map<string, string[]>();
      referencedOps.set('getUser', ['examples/get-user.json']);
      referencedOps.set('unknownOp', ['examples/unknown.json']);

      const schemaOps = new Set(['getUser', 'createUser']);

      const warnings = validator.crossValidateOperations(referencedOps, schemaOps);

      expect(warnings).toHaveLength(1);
      expect(warnings[0].code).toBe('UNKNOWN_OPERATION');
      expect(warnings[0].severity).toBe('warning');
      expect(warnings[0].message).toContain('unknownOp');
    });

    it('returns warnings for each file referencing unknown operation', () => {
      const referencedOps = new Map<string, string[]>();
      referencedOps.set('unknownOp', ['file1.json', 'file2.json']);

      const schemaOps = new Set(['getUser']);

      const warnings = validator.crossValidateOperations(referencedOps, schemaOps);

      expect(warnings).toHaveLength(2);
      expect(warnings[0].file).toBe('file1.json');
      expect(warnings[1].file).toBe('file2.json');
    });

    it('returns multiple warnings for multiple unknown operations', () => {
      const referencedOps = new Map<string, string[]>();
      referencedOps.set('unknown1', ['file1.json']);
      referencedOps.set('unknown2', ['file2.json']);

      const schemaOps = new Set(['getUser']);

      const warnings = validator.crossValidateOperations(referencedOps, schemaOps);

      expect(warnings).toHaveLength(2);
      expect(warnings.some((w) => w.message.includes('unknown1'))).toBe(true);
      expect(warnings.some((w) => w.message.includes('unknown2'))).toBe(true);
    });

    it('handles empty referenced operations', () => {
      const referencedOps = new Map<string, string[]>();
      const schemaOps = new Set(['getUser']);

      const warnings = validator.crossValidateOperations(referencedOps, schemaOps);

      expect(warnings).toHaveLength(0);
    });

    it('handles empty schema operations', () => {
      const referencedOps = new Map<string, string[]>();
      referencedOps.set('getUser', ['file.json']);

      const schemaOps = new Set<string>();

      const warnings = validator.crossValidateOperations(referencedOps, schemaOps);

      expect(warnings).toHaveLength(1);
      expect(warnings[0].message).toContain('getUser');
    });
  });
});
