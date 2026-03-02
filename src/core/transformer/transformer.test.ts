import { describe, it, expect } from 'vitest';
import { Transformer } from './transformer';
import { Operation as BaseOperation, TypeDefinition } from '../parser/types';
import { ExampleFile } from '../metadata/types';

describe('Transformer', () => {
  const mockTypes: TypeDefinition[] = [
    { kind: 'SCALAR', name: 'String' },
    { kind: 'OBJECT', name: 'User', fields: [] },
  ];

  const mockOperations: BaseOperation[] = [
    {
      name: 'getUser',
      operationType: 'query',
      arguments: [],
      returnType: 'User',
      directives: {
        docGroup: { name: 'Users' },
        docPriority: { level: 2 },
      },
      referencedTypes: ['User'],
      isDeprecated: false,
    },
    {
      name: 'createUser',
      operationType: 'mutation',
      arguments: [],
      returnType: 'User',
      directives: {
        docGroup: { name: 'Users' },
        docPriority: { level: 1 },
      },
      referencedTypes: ['User'],
      isDeprecated: false,
    },
    {
      name: 'getSystemInfo',
      operationType: 'query',
      arguments: [],
      returnType: 'String',
      directives: {
        docGroup: { name: 'System' },
      },
      referencedTypes: ['String'],
      isDeprecated: false,
    },
  ];

  it('groups and sorts operations using default alphabetical section ordering', () => {
    const transformer = new Transformer(mockTypes);
    const result = transformer.transform(mockOperations, []);

    expect(result.sections).toHaveLength(2);
    expect(result.sections[0].name).toBe('System');
    expect(result.sections[1].name).toBe('Users');

    const usersSection = result.sections[1];
    const mainSubsection = usersSection.subsections[0];
    expect(mainSubsection.operations).toHaveLength(2);
    expect(mainSubsection.operations[0].name).toBe('createUser');
    expect(mainSubsection.operations[1].name).toBe('getUser');
  });

  it('excludes operations in configured doc groups', () => {
    const transformer = new Transformer(mockTypes, { excludeDocGroups: ['System'] });
    const result = transformer.transform(mockOperations, []);

    expect(result.sections).toHaveLength(1);
    expect(result.sections[0].name).toBe('Users');
  });

  it('merges metadata', () => {
    const exampleFiles: ExampleFile[] = [
      {
        operation: 'getUser',
        examples: [
          {
            name: 'Basic Usage',
            description: 'Get user by ID',
            query: 'query { getUser(id: "1") { id } }',
            variables: {},
            response: {
              type: 'success',
              httpStatus: 200,
              body: { data: { getUser: { id: '1' } } },
            },
          },
        ],
        operationType: 'query',
      },
    ];

    const transformer = new Transformer(mockTypes);
    const result = transformer.transform(mockOperations, exampleFiles);

    const usersSection = result.sections.find((s) => s.name === 'Users');
    const getUserOp = usersSection?.subsections[0].operations.find((op) => op.name === 'getUser');

    expect(getUserOp).toBeDefined();
    expect(getUserOp?.examples).toHaveLength(1);
    expect(getUserOp?.examples[0].name).toBe('Basic Usage');
  });

  it('handles subsections', () => {
    const opsWithSubsections: BaseOperation[] = [
      {
        name: 'op1',
        operationType: 'query',
        arguments: [],
        returnType: 'String',
        directives: {
          docGroup: { name: 'Group', subsection: 'Sub A' },
        },
        referencedTypes: [],
        isDeprecated: false,
      },
      {
        name: 'op2',
        operationType: 'query',
        arguments: [],
        returnType: 'String',
        directives: {
          docGroup: { name: 'Group', subsection: 'Sub B' },
        },
        referencedTypes: [],
        isDeprecated: false,
      },
      {
        name: 'op3',
        operationType: 'query',
        arguments: [],
        returnType: 'String',
        directives: {
          docGroup: { name: 'Group' },
        },
        referencedTypes: [],
        isDeprecated: false,
      },
    ];

    const transformer = new Transformer(mockTypes);
    const result = transformer.transform(opsWithSubsections, []);

    const section = result.sections[0];
    expect(section.subsections).toHaveLength(3);
    expect(section.subsections[0].name).toBe('');
    expect(section.subsections[0].operations[0].name).toBe('op3');
    expect(section.subsections[1].name).toBe('Sub A');
    expect(section.subsections[2].name).toBe('Sub B');
  });

  it('supports explicit group ordering mode', () => {
    const opsWithGroups: BaseOperation[] = [
      {
        name: 'alpha',
        operationType: 'query',
        arguments: [],
        returnType: 'String',
        directives: { docGroup: { name: 'Alpha' } },
        referencedTypes: [],
        isDeprecated: false,
      },
      {
        name: 'payments',
        operationType: 'query',
        arguments: [],
        returnType: 'String',
        directives: { docGroup: { name: 'Payments' } },
        referencedTypes: [],
        isDeprecated: false,
      },
      {
        name: 'users',
        operationType: 'query',
        arguments: [],
        returnType: 'String',
        directives: { docGroup: { name: 'Users' } },
        referencedTypes: [],
        isDeprecated: false,
      },
    ];

    const transformer = new Transformer(mockTypes, {
      groupOrdering: {
        mode: 'explicit',
        explicitOrder: ['Users', 'Payments'],
      },
    });
    const result = transformer.transform(opsWithGroups, []);

    expect(result.sections.map((section) => section.name)).toEqual(['Users', 'Payments', 'Alpha']);
    expect(result.sections.map((section) => section.order)).toEqual([1, 2, 3]);
  });

  it('supports pinned ordering with normalized matching and keeps Uncategorized last', () => {
    const opsWithUncategorized: BaseOperation[] = [
      {
        name: 'alpha',
        operationType: 'query',
        arguments: [],
        returnType: 'String',
        directives: { docGroup: { name: 'Alpha' } },
        referencedTypes: [],
        isDeprecated: false,
      },
      {
        name: 'auth',
        operationType: 'query',
        arguments: [],
        returnType: 'String',
        directives: { docGroup: { name: 'Auth Group' } },
        referencedTypes: [],
        isDeprecated: false,
      },
      {
        name: 'legacy',
        operationType: 'query',
        arguments: [],
        returnType: 'String',
        directives: { docGroup: { name: 'Deprecated' } },
        referencedTypes: [],
        isDeprecated: false,
      },
      {
        name: 'uncategorizedOp',
        operationType: 'query',
        arguments: [],
        returnType: 'String',
        directives: {},
        referencedTypes: [],
        isDeprecated: false,
      },
    ];

    const transformer = new Transformer(mockTypes, {
      groupOrdering: {
        mode: 'pinned',
        pinToStart: ['auth_group'],
        pinToEnd: ['DEPRECATED'],
      },
    });
    const result = transformer.transform(opsWithUncategorized, []);

    expect(result.sections.map((section) => section.name)).toEqual([
      'Auth Group',
      'Alpha',
      'Deprecated',
      'Uncategorized',
    ]);
    expect(result.sections.map((section) => section.order)).toEqual([1, 2, 3, 4]);
  });
});
