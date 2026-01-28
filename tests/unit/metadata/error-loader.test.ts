// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadErrors } from '../../../src/core/metadata/error-loader';
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

describe('loadErrors', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should load and validate valid error files', async () => {
    const mockFiles = ['errors.json'];
    const mockContent = {
      category: 'UserErrors',
      operations: ['getUser'],
      errors: [
        {
          code: 'NOT_FOUND',
          message: 'User not found',
          description: 'The user with the given ID does not exist',
        },
      ],
    };

    (glob as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockFiles);
    (fs.readJson as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockContent);

    const result = await loadErrors('*.json');

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(mockContent);
  });

  it('should throw error for invalid error files', async () => {
    const mockFiles = ['invalid.json'];
    const mockContent = {
      category: 'UserErrors',
      // Missing operations
      errors: [],
    };

    (glob as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockFiles);
    (fs.readJson as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockContent);

    await expect(loadErrors('*.json')).rejects.toThrow('Invalid error file invalid.json');
  });
});
