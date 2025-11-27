import { describe, it, expect } from 'vitest';
import { DocusaurusAdapter } from './docusaurus-adapter';
import { DocModel, Operation, Section } from '../transformer/types';

describe('DocusaurusAdapter', () => {
  const mockOperation: Operation = {
    name: 'getUser',
    operationType: 'query',
    arguments: [],
    returnType: { kind: 'SCALAR', name: 'User' },
    directives: {
      docGroup: { name: 'Users', order: 1 },
      docTags: { tags: ['read', 'user'] },
    },
    referencedTypes: [],
    isDeprecated: false,
    examples: [],
    errors: [],
  };

  const mockModel: DocModel = {
    sections: [
      {
        name: 'Users',
        order: 1,
        subsections: [
          {
            name: '', // Root subsection
            operations: [mockOperation],
          },
          {
            name: 'Admin',
            operations: [
              {
                ...mockOperation,
                name: 'deleteUser',
                directives: { docGroup: { name: 'Users', subsection: 'Admin' } },
              },
            ],
          },
        ],
      },
    ],
  };

  it('generates correct file structure', () => {
    const adapter = new DocusaurusAdapter();
    const files = adapter.adapt(mockModel);

    // Expect:
    // 1. users/_category_.json
    // 2. users/get-user.mdx
    // 3. users/admin/_category_.json
    // 4. users/admin/delete-user.mdx

    expect(files).toHaveLength(4);

    const paths = files.map((f) => f.path).sort();
    expect(paths).toEqual([
      'users/_category_.json',
      'users/admin/_category_.json',
      'users/admin/delete-user.mdx',
      'users/get-user.mdx',
    ]);
  });

  it('generates correct front matter', () => {
    const adapter = new DocusaurusAdapter();
    const files = adapter.adapt(mockModel);
    console.log(
      'Generated files:',
      files.map((f) => f.path)
    );
    const mdxFile = files.find((f) => f.path === 'users/get-user.mdx');

    expect(mdxFile).toBeDefined();
    expect(mdxFile?.content).toContain('id: get-user');
    expect(mdxFile?.content).toContain('title: getUser');
    expect(mdxFile?.content).toContain('sidebar_label: getUser');
    expect(mdxFile?.content).toContain('tags: ["read", "user"]');
  });

  it('generates correct category json', () => {
    const adapter = new DocusaurusAdapter();
    const files = adapter.adapt(mockModel);
    const categoryFile = files.find((f) => f.path === 'users/_category_.json');

    expect(categoryFile).toBeDefined();
    const content = JSON.parse(categoryFile!.content);
    expect(content.label).toBe('Users');
    expect(content.position).toBe(1);
    expect(content.link.type).toBe('generated-index');
  });
});
