import { ExpandedType, ExpandedArgument } from '../src/core/transformer/types';

export const mockScalar: ExpandedType = {
  kind: 'SCALAR',
  name: 'String',
  description: 'The String scalar type represents textual data.',
};

export const mockEnum: ExpandedType = {
  kind: 'ENUM',
  name: 'Role',
  description: 'User roles in the system',
  values: [
    { name: 'ADMIN', description: 'Administrator with full access', isDeprecated: false },
    { name: 'USER', description: 'Standard user', isDeprecated: false },
    {
      name: 'GUEST',
      description: 'Read-only access',
      isDeprecated: true,
      deprecationReason: 'Use ANONYMOUS instead',
    },
  ],
};

export const mocks: Record<string, ExpandedType> = {
  Scalar: mockScalar,
  Enum: mockEnum,
  List: {
    kind: 'LIST',
    ofType: mockScalar,
  },
  SimpleObject: {
    kind: 'OBJECT',
    name: 'User',
    description: 'A user in the system',
    fields: [
      {
        name: 'id',
        type: { kind: 'SCALAR', name: 'ID' },
        isRequired: true,
        isList: false,
        isDeprecated: false,
      },
      {
        name: 'username',
        type: mockScalar,
        isRequired: true,
        isList: false,
        isDeprecated: false,
      },
      {
        name: 'role',
        type: mockEnum,
        isRequired: false,
        isList: false,
        isDeprecated: false,
      },
    ],
  },
  DeepObject: {
    kind: 'OBJECT',
    name: 'Post',
    fields: [
      {
        name: 'title',
        type: mockScalar,
        isRequired: true,
        isList: false,
        isDeprecated: false,
      },
      {
        name: 'comments',
        isRequired: false,
        isList: true,
        isDeprecated: false,
        type: {
          kind: 'LIST',
          ofType: {
            kind: 'OBJECT',
            name: 'Comment',
            fields: [
              {
                name: 'body',
                type: mockScalar,
                isRequired: true,
                isList: false,
                isDeprecated: false,
              },
              {
                name: 'author',
                type: {
                  kind: 'OBJECT',
                  name: 'User',
                  fields: [], // Simplified for recursion example
                },
                isRequired: true,
                isList: false,
                isDeprecated: false,
              },
            ],
          },
        },
      },
    ],
  },
  CircularRef: {
    kind: 'CIRCULAR_REF',
    ref: 'SomeType',
    link: '#sometype',
  } as ExpandedType,
};

export const mockArgs: ExpandedArgument[] = [
  {
    name: 'id',
    description: 'The ID of the item',
    type: {
      kind: 'SCALAR',
      name: 'ID',
    } as ExpandedType,
    isRequired: true,
    defaultValue: undefined,
  },
  {
    name: 'input',
    description: 'The input object',
    type: {
      kind: 'OBJECT',
      name: 'CreateItemInput',
      fields: [],
    } as ExpandedType,
    isRequired: false,
    defaultValue: undefined,
  },
  {
    name: 'status',
    type: {
      kind: 'ENUM',
      name: 'Status',
      values: [],
    } as ExpandedType,
    isRequired: false,
    defaultValue: 'ACTIVE',
  },
];
