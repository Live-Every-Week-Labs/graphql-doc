import { describe, it, expect } from 'vitest';
import { SidebarGenerator } from './sidebar-generator';
import { DocModel, Operation } from '../../transformer/types';

describe('SidebarGenerator', () => {
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

  it('generates correct sidebar structure', () => {
    const generator = new SidebarGenerator();
    const items = generator.generate(mockModel);

    expect(items).toBeDefined();
    expect(items.length).toBeGreaterThan(2);

    const operationsHeader = items[0];
    expect(operationsHeader.type).toBe('html');
    expect(operationsHeader.value).toContain('Operations');

    const usersCategory = items[1];
    expect(usersCategory.type).toBe('category');
    expect(usersCategory.label).toBe('Users');
    expect(usersCategory.link).toBeUndefined();
    expect(usersCategory.items).toHaveLength(2);

    // Check root operation
    const getUserOp = usersCategory.items?.find((item) => item.label === 'getUser');
    expect(getUserOp).toBeDefined();
    expect(getUserOp?.type).toBe('doc');
    expect(getUserOp?.id).toBe('users/get-user');

    // Check nested category
    const adminCategory = usersCategory.items?.find((item) => item.label === 'Admin');
    expect(adminCategory).toBeDefined();
    expect(adminCategory?.type).toBe('category');
    expect(adminCategory?.items).toHaveLength(1);

    const deleteUserOp = adminCategory?.items?.[0];
    expect(deleteUserOp?.type).toBe('doc');
    expect(deleteUserOp?.id).toBe('users/admin/delete-user');

    const typesHeader = items.find((item) => item.type === 'html' && item.value?.includes('Types'));
    expect(typesHeader).toBeDefined();

    const typeCategories = items.filter(
      (item) => item.type === 'category' && item.label !== 'Users'
    );
    expect(typeCategories.map((item) => item.label)).toEqual(['Enums', 'Inputs', 'Types']);
  });

  it('adds category index links when enabled', () => {
    const generator = new SidebarGenerator({ categoryIndex: true });
    const items = generator.generate(mockModel);

    const usersCategory = items.find((item) => item.type === 'category' && item.label === 'Users')!;
    expect(usersCategory.link).toEqual({ type: 'generated-index' });

    const adminCategory = usersCategory.items?.find((item) => item.label === 'Admin');
    expect(adminCategory?.link).toEqual({ type: 'generated-index' });

    const typeCategories = items.filter(
      (item) => item.type === 'category' && item.label !== 'Users'
    );
    typeCategories.forEach((category) => {
      expect(category.link).toEqual({ type: 'generated-index' });
    });
  });

  it('uses custom section labels when configured', () => {
    const generator = new SidebarGenerator({
      sectionLabels: { operations: 'API Ops', types: 'Schema Types' },
    });
    const items = generator.generate(mockModel);

    const operationsHeader = items.find(
      (item) => item.type === 'html' && item.value?.includes('API Ops')
    );
    const typesHeader = items.find(
      (item) => item.type === 'html' && item.value?.includes('Schema Types')
    );

    expect(operationsHeader).toBeDefined();
    expect(typesHeader).toBeDefined();
  });

  describe('generateSinglePageSidebar', () => {
    it('generates sidebar with hash links for operations', () => {
      const generator = new SidebarGenerator();
      const items = generator.generateSinglePageSidebar(mockModel, 'api-reference');

      expect(items).toBeDefined();
      expect(items.length).toBeGreaterThan(2);

      const operationsHeader = items[0];
      expect(operationsHeader.type).toBe('html');
      expect(operationsHeader.value).toContain('Operations');

      const usersCategory = items[1];
      expect(usersCategory.type).toBe('category');
      expect(usersCategory.label).toBe('Users');
      expect(usersCategory.link).toBeUndefined();

      // Check root operation uses link type with href
      const getUserOp = usersCategory.items?.find((item) => item.label === 'getUser');
      expect(getUserOp).toBeDefined();
      expect(getUserOp?.type).toBe('link');
      expect(getUserOp?.href).toBe('api-reference#get-user');
    });

    it('generates nested categories with hash links', () => {
      const generator = new SidebarGenerator();
      const items = generator.generateSinglePageSidebar(mockModel, 'api-reference');

      const usersCategory = items.find(
        (item) => item.type === 'category' && item.label === 'Users'
      );
      const adminCategory = usersCategory.items?.find((item) => item.label === 'Admin');

      expect(adminCategory).toBeDefined();
      expect(adminCategory?.type).toBe('category');
      expect(adminCategory?.link).toBeUndefined();

      const deleteUserOp = adminCategory?.items?.[0];
      expect(deleteUserOp?.type).toBe('link');
      expect(deleteUserOp?.href).toBe('api-reference#delete-user');

      const typeCategories = items.filter(
        (item) => item.type === 'category' && item.label !== 'Users'
      );
      expect(typeCategories.map((item) => item.label)).toEqual(['Enums', 'Inputs', 'Types']);
    });

    it('uses custom docId in hash links', () => {
      const generator = new SidebarGenerator();
      const items = generator.generateSinglePageSidebar(mockModel, 'custom-doc-id');

      const usersCategory = items.find(
        (item) => item.type === 'category' && item.label === 'Users'
      );
      const getUserOp = usersCategory?.items?.find((item) => item.label === 'getUser');

      expect(getUserOp?.href).toBe('custom-doc-id#get-user');
    });

    it('adds category links in single-page mode when enabled', () => {
      const generator = new SidebarGenerator({ categoryIndex: true });
      const items = generator.generateSinglePageSidebar(mockModel, 'api-reference');

      const usersCategory = items.find(
        (item) => item.type === 'category' && item.label === 'Users'
      )!;
      expect(usersCategory.link).toEqual({ type: 'doc', id: 'api-reference' });

      const adminCategory = usersCategory.items?.find((item) => item.label === 'Admin');
      expect(adminCategory?.link).toEqual({ type: 'doc', id: 'api-reference' });
    });
  });
});
