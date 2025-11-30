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
        { path: 'file1.mdx', content: 'Content 1' },
        { path: 'file2.mdx', content: 'Content 2' },
        { path: 'file3.mdx', content: 'Content 3' },
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
        { path: 'dir1/dir2/dir3/test.mdx', content: 'Nested content' },
      ];

      await fileWriter.write(files);

      const filePath = path.join(testDir, 'dir1/dir2/dir3/test.mdx');
      expect(await fs.pathExists(filePath)).toBe(true);

      const content = await fs.readFile(filePath, 'utf-8');
      expect(content).toBe('Nested content');
    });

    it('creates multiple files in nested directories', async () => {
      const files: GeneratedFile[] = [
        { path: 'queries/users/get-user.mdx', content: 'Get User' },
        { path: 'queries/users/list-users.mdx', content: 'List Users' },
        { path: 'mutations/users/create-user.mdx', content: 'Create User' },
        { path: '_category_.json', content: '{"label": "API"}' },
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

      const files: GeneratedFile[] = [{ path: 'existing.mdx', content: 'New content' }];

      await fileWriter.write(files);

      const content = await fs.readFile(filePath, 'utf-8');
      expect(content).toBe('New content');
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

      const files: GeneratedFile[] = [{ path: 'test.mdx', content: 'Content' }];

      await fileWriter.write(files);

      expect(await fs.pathExists(testDir)).toBe(true);
      expect(await fs.pathExists(path.join(testDir, 'test.mdx'))).toBe(true);
    });
  });

  describe('with different output directories', () => {
    it('writes to custom output directory', async () => {
      const customDir = path.join(testDir, 'custom-output');
      const customWriter = new FileWriter(customDir);

      const files: GeneratedFile[] = [{ path: 'test.mdx', content: 'Custom dir content' }];

      await customWriter.write(files);

      const filePath = path.join(customDir, 'test.mdx');
      expect(await fs.pathExists(filePath)).toBe(true);

      const content = await fs.readFile(filePath, 'utf-8');
      expect(content).toBe('Custom dir content');
    });

    it('handles deeply nested output directory', async () => {
      const deepDir = path.join(testDir, 'a/b/c/d/e');
      const deepWriter = new FileWriter(deepDir);

      const files: GeneratedFile[] = [{ path: 'deep.mdx', content: 'Deep content' }];

      await deepWriter.write(files);

      const filePath = path.join(deepDir, 'deep.mdx');
      expect(await fs.pathExists(filePath)).toBe(true);
    });
  });
});
