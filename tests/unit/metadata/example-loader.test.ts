// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadExamples } from '../../../src/core/metadata/example-loader';
import * as fs from 'fs-extra';
import { glob } from 'glob';

vi.mock('fs-extra', () => {
  const readJson = vi.fn();
  return {
    readJson,
    default: { readJson },
  };
});
vi.mock('glob', () => ({
  glob: vi.fn(),
}));

describe('loadExamples', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should load and validate valid example files', async () => {
    const mockFiles = ['example1.json'];
    const mockContent = {
      operation: 'getUser',
      operationType: 'query',
      examples: [
        {
          name: 'Success',
          query: 'query { user { id } }',
          response: {
            type: 'success',
            httpStatus: 200,
            body: { data: { user: { id: '1' } } },
          },
        },
      ],
    };

    (glob as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockFiles);
    (fs.readJson as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockContent);

    const result = await loadExamples('*.json');

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(mockContent);
    expect(glob).toHaveBeenCalledWith('*.json');
    expect(fs.readJson).toHaveBeenCalledWith('example1.json');
  });

  it('should allow optional httpStatus', async () => {
    const mockFiles = ['optional.json'];
    const mockContent = {
      operation: 'getUser',
      operationType: 'query',
      examples: [
        {
          name: 'Success',
          query: 'query { ... }',
          response: {
            type: 'success',
            // httpStatus omitted
            body: { data: {} },
          },
        },
      ],
    };

    (glob as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockFiles);
    (fs.readJson as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockContent);

    const result = await loadExamples('*.json');
    expect(result).toHaveLength(1);
    expect(result[0].examples[0].response.httpStatus).toBeUndefined();
  });

  it('should load example files that contain multiple operations', async () => {
    const mockFiles = ['multi.json'];
    const mockContent = [
      {
        operation: 'getUser',
        operationType: 'query',
        examples: [
          {
            name: 'Success',
            query: 'query { user { id } }',
            response: {
              type: 'success',
              body: { data: { user: { id: '1' } } },
            },
          },
        ],
      },
      {
        operation: 'createUser',
        operationType: 'mutation',
        examples: [
          {
            name: 'Create',
            query: 'mutation { createUser { id } }',
            response: {
              type: 'success',
              body: { data: { createUser: { id: '2' } } },
            },
          },
        ],
      },
    ];

    (glob as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockFiles);
    (fs.readJson as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockContent);

    const result = await loadExamples('*.json');

    expect(result).toHaveLength(2);
    expect(result[0].operation).toBe('getUser');
    expect(result[1].operation).toBe('createUser');
  });

  it('should throw error for invalid example files', async () => {
    const mockFiles = ['invalid.json'];
    const mockContent = {
      operation: 'getUser',
      // Missing operationType
      examples: [],
    };

    (glob as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockFiles);
    (fs.readJson as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockContent);

    await expect(loadExamples('*.json')).rejects.toThrow('Invalid example file invalid.json');
  });

  it('should handle file read errors', async () => {
    const mockFiles = ['error.json'];
    (glob as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockFiles);
    (fs.readJson as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Read error'));

    await expect(loadExamples('*.json')).rejects.toThrow(
      'Invalid example file error.json: Read error'
    );
  });

  it('should load examples from multiple patterns and de-duplicate files', async () => {
    const mockGlob = glob as unknown as ReturnType<typeof vi.fn>;
    const mockReadJson = fs.readJson as unknown as ReturnType<typeof vi.fn>;
    mockGlob
      .mockResolvedValueOnce(['queries/get-user.json', 'shared/common.json'])
      .mockResolvedValueOnce(['mutations/create-user.json', 'shared/common.json']);
    mockReadJson
      .mockResolvedValueOnce({
        operation: 'getUser',
        operationType: 'query',
        examples: [
          { name: 'Get', query: 'query { getUser }', response: { type: 'success', body: {} } },
        ],
      })
      .mockResolvedValueOnce({
        operation: 'createUser',
        operationType: 'mutation',
        examples: [
          {
            name: 'Create',
            query: 'mutation { createUser }',
            response: { type: 'success', body: {} },
          },
        ],
      })
      .mockResolvedValueOnce({
        operation: 'commonOperation',
        operationType: 'query',
        examples: [
          {
            name: 'Common',
            query: 'query { commonOperation }',
            response: { type: 'success', body: {} },
          },
        ],
      });

    const result = await loadExamples(['queries/*.json', 'mutations/*.json']);

    expect(result).toHaveLength(3);
    expect(mockGlob).toHaveBeenCalledTimes(2);
    expect(mockReadJson).toHaveBeenCalledTimes(3);
  });
});
