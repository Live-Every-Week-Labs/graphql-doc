import { describe, it, expect } from 'vitest';
import { Transformer } from './transformer';
import { Operation as BaseOperation, TypeDefinition } from '../parser/types';
import { ExampleFile, ErrorFile } from '../metadata/types';

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
        docGroup: { name: 'Users', order: 1 },
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
        docGroup: { name: 'Users', order: 1 },
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
        docGroup: { name: 'System', order: 2 },
      },
      referencedTypes: ['String'],
      isDeprecated: false,
    },
  ];

  it('groups and sorts operations', () => {
    const transformer = new Transformer(mockTypes);
    const result = transformer.transform(mockOperations, [], []);

    expect(result.sections).toHaveLength(2);
    expect(result.sections[0].name).toBe('Users');
    expect(result.sections[1].name).toBe('System');

    const usersSection = result.sections[0];
    // Check sorting within section (createUser priority 1 < getUser priority 2)
    const mainSubsection = usersSection.subsections[0];
    expect(mainSubsection.operations).toHaveLength(2);
    expect(mainSubsection.operations[0].name).toBe('createUser');
    expect(mainSubsection.operations[1].name).toBe('getUser');
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

    const errorFiles: ErrorFile[] = [
      {
        operations: ['*'],
        errors: [
          {
            code: 'INTERNAL_ERROR',
            message: 'Something went wrong',
            description: '',
          },
        ],
        category: 'General',
      },
    ];

    const transformer = new Transformer(mockTypes);
    const result = transformer.transform(mockOperations, exampleFiles, errorFiles);

    const usersSection = result.sections.find((s) => s.name === 'Users');
    const getUserOp = usersSection?.subsections[0].operations.find((op) => op.name === 'getUser');

    expect(getUserOp).toBeDefined();
    expect(getUserOp?.examples).toHaveLength(1);
    expect(getUserOp?.examples[0].name).toBe('Basic Usage');
    expect(getUserOp?.errors).toHaveLength(1);
    expect(getUserOp?.errors[0].code).toBe('INTERNAL_ERROR');
  });

  it('handles subsections', () => {
    const opsWithSubsections: BaseOperation[] = [
      {
        name: 'op1',
        operationType: 'query',
        arguments: [],
        returnType: 'String',
        directives: {
          docGroup: { name: 'Group', order: 1, subsection: 'Sub A' },
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
          docGroup: { name: 'Group', order: 1, subsection: 'Sub B' },
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
          docGroup: { name: 'Group', order: 1 }, // No subsection -> Root
        },
        referencedTypes: [],
        isDeprecated: false,
      },
    ];

    const transformer = new Transformer(mockTypes);
    const result = transformer.transform(opsWithSubsections, [], []);

    const section = result.sections[0];
    expect(section.subsections).toHaveLength(3);
    // Root subsection (empty name) should be first
    expect(section.subsections[0].name).toBe('');
    expect(section.subsections[0].operations[0].name).toBe('op3');

    // Then alphabetical
    expect(section.subsections[1].name).toBe('Sub A');
    expect(section.subsections[2].name).toBe('Sub B');
  });

  it('sorts sections with order first, then alphabetically for unordered', () => {
    const opsWithMixedOrder: BaseOperation[] = [
      {
        name: 'op1',
        operationType: 'query',
        arguments: [],
        returnType: 'String',
        directives: {
          docGroup: { name: 'Zebra', order: undefined }, // No order - should be last alphabetically
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
          docGroup: { name: 'Users', order: 2 },
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
          docGroup: { name: 'Alpha' }, // No order - should be first alphabetically among unordered
        },
        referencedTypes: [],
        isDeprecated: false,
      },
      {
        name: 'op4',
        operationType: 'query',
        arguments: [],
        returnType: 'String',
        directives: {
          docGroup: { name: 'Payments', order: 1 },
        },
        referencedTypes: [],
        isDeprecated: false,
      },
    ];

    const transformer = new Transformer(mockTypes);
    const result = transformer.transform(opsWithMixedOrder, [], []);

    expect(result.sections).toHaveLength(4);
    // Ordered sections first (by order number)
    expect(result.sections[0].name).toBe('Payments'); // order: 1
    expect(result.sections[1].name).toBe('Users'); // order: 2
    // Unordered sections last (alphabetically)
    expect(result.sections[2].name).toBe('Alpha'); // no order, alphabetically first
    expect(result.sections[3].name).toBe('Zebra'); // no order, alphabetically last
  });

  it('sorts all sections alphabetically when none have order', () => {
    const opsWithNoOrder: BaseOperation[] = [
      {
        name: 'op1',
        operationType: 'query',
        arguments: [],
        returnType: 'String',
        directives: {
          docGroup: { name: 'Zebra' },
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
          docGroup: { name: 'Alpha' },
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
          docGroup: { name: 'Middle' },
        },
        referencedTypes: [],
        isDeprecated: false,
      },
    ];

    const transformer = new Transformer(mockTypes);
    const result = transformer.transform(opsWithNoOrder, [], []);

    expect(result.sections).toHaveLength(3);
    expect(result.sections[0].name).toBe('Alpha');
    expect(result.sections[1].name).toBe('Middle');
    expect(result.sections[2].name).toBe('Zebra');
  });
});
