import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DocusaurusAdapter } from './docusaurus-adapter';
import { DocModel, Operation, Section } from '../../transformer/types';
import * as path from 'path';

const fsMock = vi.hoisted(() => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
}));

vi.mock('fs', () => fsMock);
vi.mock('../../renderer/mdx-renderer', () => {
  return {
    MdxRenderer: class {
      renderOperation = vi.fn().mockReturnValue('Mocked Content');
      renderTypeDefinition = vi.fn().mockReturnValue('Mocked Type Content');
    },
  };
});

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
                directives: { docGroup: { name: 'Users', subsection: 'Admin', order: 2 } },
              },
            ],
          },
        ],
      },
    ],
    types: [
      { kind: 'ENUM', name: 'UserStatus', values: [] },
      { kind: 'INPUT_OBJECT', name: 'UserInput', fields: [] },
      { kind: 'OBJECT', name: 'User', fields: [] },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    fsMock.existsSync.mockReturnValue(false);
    fsMock.readFileSync.mockReturnValue('');
  });

  it('generates sidebars.js when no existing sidebar file', () => {
    const adapter = new DocusaurusAdapter();
    const files = adapter.adapt(mockModel);

    const sidebarFile = files.find((f) => f.path === 'sidebars.js');
    expect(sidebarFile).toBeDefined();
    expect(sidebarFile?.content).toContain('apiSidebar');
  });

  it('merges into sidebars.js when sidebar file exists', () => {
    fsMock.existsSync.mockReturnValue(true);
    fsMock.readFileSync.mockReturnValue(
      'const sidebars = { apiSidebar: [], docs: [] };\nmodule.exports = sidebars;\n'
    );
    const adapter = new DocusaurusAdapter();
    const files = adapter.adapt(mockModel);

    const sidebarFile = files.find((f) => f.path === 'sidebars.js');
    expect(sidebarFile).toBeDefined();
    expect(sidebarFile?.content).toContain('// <graphql-docs-sidebar>');
    expect(sidebarFile?.content).toContain('__gqlDocsTargetKey');
    expect(sidebarFile?.content).toContain('module.exports[__gqlDocsTargetKey]');

    const apiSidebarFile = files.find((f) => f.path === 'sidebars.api.js');
    expect(apiSidebarFile).toBeUndefined();
  });

  it('generates correct front matter', () => {
    const adapter = new DocusaurusAdapter();
    const files = adapter.adapt(mockModel);
    const mdxFile = files.find((f) => f.path === 'users/get-user.mdx');

    expect(mdxFile).toBeDefined();
    expect(mdxFile?.content).toContain('id: get-user');
    expect(mdxFile?.content).toContain('title: getUser');
    expect(mdxFile?.content).toContain('sidebar_label: getUser');
    expect(mdxFile?.content).toContain('tags: ["read", "user"]');
    expect(mdxFile?.content).toContain('api: true');
  });

  it('generates correct category json', () => {
    const adapter = new DocusaurusAdapter();
    const files = adapter.adapt(mockModel);
    const categoryFile = files.find((f) => f.path === 'users/_category_.json');

    expect(categoryFile).toBeDefined();
    const content = JSON.parse(categoryFile!.content);
    expect(content.label).toBe('Users');
    expect(content.position).toBe(1);
    expect(content.link).toBeUndefined();
  });

  it('generates category index when enabled', () => {
    const adapter = new DocusaurusAdapter({ sidebarCategoryIndex: true });
    const files = adapter.adapt(mockModel);
    const categoryFile = files.find((f) => f.path === 'users/_category_.json');

    expect(categoryFile).toBeDefined();
    const content = JSON.parse(categoryFile!.content);
    expect(content.link.type).toBe('generated-index');
  });

  it('generates shared data files and imports by default', () => {
    const adapter = new DocusaurusAdapter();
    const files = adapter.adapt(mockModel);

    expect(files.find((f) => f.path === '_data/operations.json')).toBeDefined();
    expect(files.find((f) => f.path === '_data/types.json')).toBeDefined();

    const mdxFile = files.find((f) => f.path === 'users/get-user.mdx');
    expect(mdxFile?.content).toContain(
      "import { OperationView } from '@graphql-docs/generator/components'"
    );
    expect(mdxFile?.content).toContain("import operationsByType from '../_data/operations.json'");
    expect(mdxFile?.content).toContain("import typesByName from '../_data/types.json'");
    expect(mdxFile?.content).toContain('export const examplesByOperation');
  });

  it('prepends intro docs to the sidebar when configured', () => {
    const introPath = path.join(process.cwd(), 'docs', 'intro', 'overview.mdx');
    fsMock.existsSync.mockImplementation((value) => value === introPath);
    fsMock.readFileSync.mockReturnValue(
      '---\ntitle: Overview\nsidebar_label: Overview\n---\n\n# Overview'
    );

    const adapter = new DocusaurusAdapter({
      introDocs: [{ source: introPath, outputPath: 'intro/overview.mdx' }],
    });
    const files = adapter.adapt(mockModel);

    const introFile = files.find((f) => f.path === 'intro/overview.mdx');
    expect(introFile).toBeDefined();

    const sidebarFile = files.find((f) => f.path === 'sidebars.js');
    expect(sidebarFile).toBeDefined();
    expect(sidebarFile?.content).toContain('intro/overview');
    expect(sidebarFile?.content).toContain('gql-sidebar-divider');
  });

  describe('Single-Page Mode', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      fsMock.existsSync.mockReturnValue(false);
      fsMock.readFileSync.mockReturnValue('');
    });

    it('generates api-reference.mdx file', () => {
      const adapter = new DocusaurusAdapter({ singlePage: true });
      const files = adapter.adapt(mockModel);

      const mdxFile = files.find((f) => f.path === 'api-reference.mdx');
      expect(mdxFile).toBeDefined();
      expect(mdxFile?.type).toBe('mdx');
    });

    it('generates correct front matter for single-page', () => {
      const adapter = new DocusaurusAdapter({ singlePage: true });
      const files = adapter.adapt(mockModel);

      const mdxFile = files.find((f) => f.path === 'api-reference.mdx');
      expect(mdxFile?.content).toContain('---');
      expect(mdxFile?.content).toContain('id: api-reference');
      expect(mdxFile?.content).toContain('title: API Reference');
      expect(mdxFile?.content).toContain('sidebar_label: API Reference');
      expect(mdxFile?.content).toContain('api: true');
    });

    it('generates Table of Contents with anchor links', () => {
      const adapter = new DocusaurusAdapter({ singlePage: true });
      const files = adapter.adapt(mockModel);

      const mdxFile = files.find((f) => f.path === 'api-reference.mdx');
      expect(mdxFile?.content).toContain('## Table of Contents');
      expect(mdxFile?.content).toContain('- [Users](#users)');
      expect(mdxFile?.content).toContain('- [getUser](#get-user)');
      expect(mdxFile?.content).toContain('- [Admin](#users-admin)');
      expect(mdxFile?.content).toContain('- [deleteUser](#delete-user)');
      expect(mdxFile?.content).toContain('- [Types](#types)');
      expect(mdxFile?.content).toContain('- [Enums](#types-enums)');
      expect(mdxFile?.content).toContain('- [Inputs](#types-inputs)');
    });

    it('generates section headers with anchor IDs', () => {
      const adapter = new DocusaurusAdapter({ singlePage: true });
      const files = adapter.adapt(mockModel);

      const mdxFile = files.find((f) => f.path === 'api-reference.mdx');
      expect(mdxFile?.content).toContain('## Users {#users}');
    });

    it('generates subsection headers with composite anchor IDs', () => {
      const adapter = new DocusaurusAdapter({ singlePage: true });
      const files = adapter.adapt(mockModel);

      const mdxFile = files.find((f) => f.path === 'api-reference.mdx');
      expect(mdxFile?.content).toContain('### Admin {#users-admin}');
    });

    it('includes examples export for scroll sync panels', () => {
      const adapter = new DocusaurusAdapter({ singlePage: true });
      const files = adapter.adapt(mockModel);

      const mdxFile = files.find((f) => f.path === 'api-reference.mdx');
      expect(mdxFile?.content).toContain('export const examplesByOperation');
    });

    it('generates sidebar with hash links', () => {
      const adapter = new DocusaurusAdapter({ singlePage: true });
      const files = adapter.adapt(mockModel);

      const sidebarFile = files.find((f) => f.path === 'sidebars.js');
      expect(sidebarFile).toBeDefined();
      expect(sidebarFile?.content).toContain('api-reference#get-user');
      expect(sidebarFile?.content).toContain('"type": "link"');
    });

    it('does not generate category files in single-page mode', () => {
      const adapter = new DocusaurusAdapter({ singlePage: true });
      const files = adapter.adapt(mockModel);

      const categoryFiles = files.filter((f) => f.path.includes('_category_.json'));
      expect(categoryFiles).toHaveLength(0);
    });

    it('does not generate individual operation mdx files in single-page mode', () => {
      const adapter = new DocusaurusAdapter({ singlePage: true });
      const files = adapter.adapt(mockModel);

      const operationFiles = files.filter(
        (f) => f.path.endsWith('.mdx') && f.path !== 'api-reference.mdx'
      );
      expect(operationFiles).toHaveLength(0);
    });

    it('includes API Reference main heading', () => {
      const adapter = new DocusaurusAdapter({ singlePage: true });
      const files = adapter.adapt(mockModel);

      const mdxFile = files.find((f) => f.path === 'api-reference.mdx');
      expect(mdxFile?.content).toContain('# API Reference');
    });

    it('skips subsection header for root subsection (empty name)', () => {
      const adapter = new DocusaurusAdapter({ singlePage: true });
      const files = adapter.adapt(mockModel);

      const mdxFile = files.find((f) => f.path === 'api-reference.mdx');
      // Should NOT have a subsection header for empty name
      expect(mdxFile?.content).not.toContain('### {#users-}');
    });
  });
});
