import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadExamples } from '../../../src/core/metadata/example-loader';
import fs from 'fs-extra';
import { glob } from 'glob';

vi.mock('fs-extra');
vi.mock('glob');

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
});
