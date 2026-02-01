import type { Operation, ExpandedType, ExpandedField } from '../../core/transformer/types';
import type { Example } from '../../core/metadata/types';

export const mockScalarType: ExpandedType = {
  kind: 'SCALAR',
  name: 'String',
};

export const mockField: ExpandedField = {
  name: 'id',
  type: { kind: 'SCALAR', name: 'ID' },
  description: 'Unique identifier',
  isRequired: true,
  isList: false,
  isDeprecated: false,
};

export const mockReturnType: ExpandedType = {
  kind: 'OBJECT',
  name: 'User',
  fields: [mockField],
};

export const mockExampleSuccess: Example = {
  name: 'GetUser',
  description: 'Fetch a user by ID',
  query: 'query GetUser($id: ID!) { user(id: $id) { id } }',
  variables: { id: '123' },
  response: {
    type: 'success',
    httpStatus: 200,
    body: { data: { user: { id: '123' } } },
  },
};

export const mockExampleError: Example = {
  name: 'Invalid User',
  description: 'User not found',
  query: 'query GetUser($id: ID!) { user(id: $id) { id } }',
  variables: { id: 'bad' },
  response: {
    type: 'error',
    httpStatus: 404,
    body: { errors: [{ message: 'Not found' }] },
  },
};

export const mockOperation: Operation = {
  name: 'getUser',
  operationType: 'query',
  description: 'Fetches a user by ID.',
  arguments: [
    {
      name: 'id',
      type: mockScalarType,
      isRequired: true,
      description: 'User ID',
    },
  ],
  returnType: mockReturnType,
  examples: [mockExampleSuccess, mockExampleError],
  directives: {
    docTags: { tags: ['user'] },
  },
  referencedTypes: [],
  isDeprecated: false,
};
