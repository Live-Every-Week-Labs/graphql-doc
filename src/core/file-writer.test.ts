import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { FileWriter } from './file-writer.js';
import { GeneratedFile } from './adapters/types.js';

describe('FileWriter', () => {
  let testDir: string;
  let fileWriter: FileWriter;

  beforeEach(async () => {
    // Create a temporary directory for testing
    testDir = path.join(os.tmpdir(), `graphql-docs-file-writer-test-${Date.now()}`);
    await fs.ensureDir(testDir);
    fileWriter = new FileWriter(testDir);
  });

  afterEach(async () => {
    // Clean up test directory
    await fs.remove(testDir);
  });

  describe('write()', () => {
    it('writes a single file', async () => {
      const files: GeneratedFile[] = [
        {
          path: 'test.mdx',
          content: '# Test Content',
          type: 'mdx',
        },
      ];

      await fileWriter.write(files);

      const filePath = path.join(testDir, 'test.mdx');
      expect(await fs.pathExists(filePath)).toBe(true);

      const content = await fs.readFile(filePath, 'utf-8');
      expect(content).toBe('# Test Content');
    });

    it('writes multiple files', async () => {
      const files: GeneratedFile[] = [
        {
          path: 'file1.mdx',
          content: 'Content 1',
          type: 'mdx',
        },
        {
          path: 'file2.mdx',
          content: 'Content 2',
          type: 'mdx',
        },
        {
          path: 'file3.mdx',
          content: 'Content 3',
          type: 'mdx',
        },
      ];

      await fileWriter.write(files);

      for (const file of files) {
        const filePath = path.join(testDir, file.path);
        expect(await fs.pathExists(filePath)).toBe(true);

        const content = await fs.readFile(filePath, 'utf-8');
        expect(content).toBe(file.content);
      }
    });

    it('creates nested directories', async () => {
      const files: GeneratedFile[] = [
        {
          path: 'dir1/dir2/dir3/test.mdx',
          content: 'Nested content',
          type: 'mdx',
        },
      ];

      await fileWriter.write(files);

      const filePath = path.join(testDir, 'dir1/dir2/dir3/test.mdx');
      expect(await fs.pathExists(filePath)).toBe(true);

      const content = await fs.readFile(filePath, 'utf-8');
      expect(content).toBe('Nested content');
    });

    it('creates multiple files in nested directories', async () => {
      const files: GeneratedFile[] = [
        {
          path: 'queries/users/get-user.mdx',
          content: 'Get User',
          type: 'mdx',
        },
        {
          path: 'queries/users/list-users.mdx',
          content: 'List Users',
          type: 'mdx',
        },
        {
          path: 'mutations/users/create-user.mdx',
          content: 'Create User',
          type: 'mdx',
        },
        {
          path: '_category_.json',
          content: '{"label": "API"}',
          type: 'mdx',
        },
      ];

      await fileWriter.write(files);

      for (const file of files) {
        const filePath = path.join(testDir, file.path);
        expect(await fs.pathExists(filePath)).toBe(true);

        const content = await fs.readFile(filePath, 'utf-8');
        expect(content).toBe(file.content);
      }
    });

    it('overwrites existing files', async () => {
      // Create existing file
      const filePath = path.join(testDir, 'existing.mdx');
      await fs.writeFile(filePath, 'Old content');

      const files: GeneratedFile[] = [
        {
          path: 'existing.mdx',
          content: 'New content',
          type: 'mdx',
        },
      ];

      await fileWriter.write(files);

      const content = await fs.readFile(filePath, 'utf-8');
      expect(content).toBe('New content');
    });

    it('throws when target file path is a symlink', async () => {
      const realTargetPath = path.join(testDir, 'real-target.mdx');
      const symlinkPath = path.join(testDir, 'symlinked-output.mdx');

      await fs.writeFile(realTargetPath, 'Original target content');
      await fs.symlink(realTargetPath, symlinkPath);

      const files: GeneratedFile[] = [
        {
          path: 'symlinked-output.mdx',
          content: 'New content',
          type: 'mdx',
        },
      ];

      await expect(fileWriter.write(files)).rejects.toThrow(
        'Refusing to write through symlinked path'
      );
      expect(await fs.readFile(realTargetPath, 'utf-8')).toBe('Original target content');
    });

    it('handles empty file array', async () => {
      const files: GeneratedFile[] = [];

      await fileWriter.write(files);

      // Should not throw, output dir should exist
      expect(await fs.pathExists(testDir)).toBe(true);
    });

    it('handles files with special characters in content', async () => {
      const files: GeneratedFile[] = [
        {
          path: 'special.mdx',
          content:
            '# Special\n\n```graphql\nquery GetUser($id: ID!) {\n  user(id: $id) {\n    name\n  }\n}\n```\n',
          type: 'mdx',
        },
      ];

      await fileWriter.write(files);

      const filePath = path.join(testDir, 'special.mdx');
      const content = await fs.readFile(filePath, 'utf-8');
      expect(content).toContain('```graphql');
      expect(content).toContain('query GetUser($id: ID!)');
    });

    it('creates output directory if it does not exist', async () => {
      // Remove the test directory
      await fs.remove(testDir);

      const files: GeneratedFile[] = [
        {
          path: 'test.mdx',
          content: 'Content',
          type: 'mdx',
        },
      ];

      await fileWriter.write(files);

      expect(await fs.pathExists(testDir)).toBe(true);
      expect(await fs.pathExists(path.join(testDir, 'test.mdx'))).toBe(true);
    });
  });

  describe('with different output directories', () => {
    it('writes to custom output directory', async () => {
      const customDir = path.join(testDir, 'custom-output');
      const customWriter = new FileWriter(customDir);

      const files: GeneratedFile[] = [
        {
          path: 'test.mdx',
          content: 'Custom dir content',
          type: 'mdx',
        },
      ];

      await customWriter.write(files);

      const filePath = path.join(customDir, 'test.mdx');
      expect(await fs.pathExists(filePath)).toBe(true);

      const content = await fs.readFile(filePath, 'utf-8');
      expect(content).toBe('Custom dir content');
    });

    it('handles deeply nested output directory', async () => {
      const deepDir = path.join(testDir, 'a/b/c/d/e');
      const deepWriter = new FileWriter(deepDir);

      const files: GeneratedFile[] = [
        {
          path: 'deep.mdx',
          content: 'Deep content',
          type: 'mdx',
        },
      ];

      await deepWriter.write(files);

      const filePath = path.join(deepDir, 'deep.mdx');
      expect(await fs.pathExists(filePath)).toBe(true);
    });
  });

  describe('duplicate path prevention', () => {
    it('throws when two relative files resolve to the same output path', async () => {
      const files: GeneratedFile[] = [
        {
          path: 'duplicate.mdx',
          content: 'First',
          type: 'mdx',
        },
        {
          path: 'duplicate.mdx',
          content: 'Second',
          type: 'mdx',
        },
      ];

      await expect(fileWriter.write(files)).rejects.toThrow('Duplicate output path detected');
    });

    it('throws when relative and absolute targets resolve to the same path', async () => {
      const sharedAbsolutePath = path.join(testDir, 'same-target.mdx');
      const files: GeneratedFile[] = [
        {
          path: 'same-target.mdx',
          content: 'Relative target',
          type: 'mdx',
        },
        {
          path: 'alias.mdx',
          absolutePath: sharedAbsolutePath,
          content: 'Absolute target',
          type: 'mdx',
        },
      ];

      await expect(fileWriter.write(files)).rejects.toThrow('Duplicate output path detected');
    });
  });

  describe('path traversal prevention', () => {
    it('throws error for simple ../ traversal', async () => {
      const files: GeneratedFile[] = [
        {
          path: '../outside.mdx',
          content: 'Malicious content',
          type: 'mdx',
        },
      ];

      await expect(fileWriter.write(files)).rejects.toThrow('Path traversal attempt detected');
    });

    it('throws error for nested ../ traversal', async () => {
      const files: GeneratedFile[] = [
        {
          path: 'subdir/../../outside.mdx',
          content: 'Malicious content',
          type: 'mdx',
        },
      ];

      await expect(fileWriter.write(files)).rejects.toThrow('Path traversal attempt detected');
    });

    it('throws error for deep ../ traversal', async () => {
      const files: GeneratedFile[] = [
        {
          path: '../../../etc/passwd',
          content: 'Malicious content',
          type: 'mdx',
        },
      ];

      await expect(fileWriter.write(files)).rejects.toThrow('Path traversal attempt detected');
    });

    it('throws error for traversal hidden in nested path', async () => {
      const files: GeneratedFile[] = [
        {
          path: 'dir/../../../outside.mdx',
          content: 'Malicious content',
          type: 'mdx',
        },
      ];

      await expect(fileWriter.write(files)).rejects.toThrow('Path traversal attempt detected');
    });

    it('allows legitimate nested paths', async () => {
      const files: GeneratedFile[] = [
        {
          path: 'api/users/get-user.mdx',
          content: 'Legitimate content',
          type: 'mdx',
        },
      ];

      await fileWriter.write(files);

      const filePath = path.join(testDir, 'api/users/get-user.mdx');
      expect(await fs.pathExists(filePath)).toBe(true);
    });

    it('allows paths with ./ prefix', async () => {
      const files: GeneratedFile[] = [
        {
          path: './valid-file.mdx',
          content: 'Valid content',
          type: 'mdx',
        },
      ];

      await fileWriter.write(files);

      const filePath = path.join(testDir, 'valid-file.mdx');
      expect(await fs.pathExists(filePath)).toBe(true);
    });

    it('includes the malicious path in error message', async () => {
      const maliciousPath = '../evil.mdx';
      const files: GeneratedFile[] = [
        {
          path: maliciousPath,
          content: 'Malicious content',
          type: 'mdx',
        },
      ];

      await expect(fileWriter.write(files)).rejects.toThrow(maliciousPath);
    });

    it('does not write any files when path traversal is detected', async () => {
      const files: GeneratedFile[] = [
        {
          path: 'valid.mdx',
          content: 'Valid content',
          type: 'mdx',
        },
        {
          path: '../outside.mdx',
          content: 'Malicious content',
          type: 'mdx',
        },
      ];

      await expect(fileWriter.write(files)).rejects.toThrow('Path traversal attempt detected');

      // With validate-first batching, no files in the batch are written when validation fails
      const validPath = path.join(testDir, 'valid.mdx');
      expect(await fs.pathExists(validPath)).toBe(false);

      // The malicious file should not exist outside the directory
      const outsidePath = path.join(testDir, '..', 'outside.mdx');
      expect(await fs.pathExists(outsidePath)).toBe(false);
    });
  });
});
