import { describe, it, expect } from 'vitest';
import { LlmDocsGenerator } from './generator';
import { DocModel, ExpandedType, Operation } from '../transformer/types';

const makeTypeRef = (name: string): ExpandedType => ({
  kind: 'TYPE_REF',
  name,
  link: `#${name.toLowerCase()}`,
});

describe('LlmDocsGenerator', () => {
  it('generates index, chunk files, and manifest', () => {
    const userType: ExpandedType = {
      kind: 'OBJECT',
      name: 'User',
      fields: [
        {
          name: 'id',
          description: 'User id',
          type: { kind: 'SCALAR', name: 'ID' },
          typeString: 'ID!',
          isRequired: true,
          isList: false,
          isDeprecated: false,
        },
        {
          name: 'profile',
          description: 'User profile',
          type: makeTypeRef('Profile'),
          typeString: 'Profile',
          isRequired: false,
          isList: false,
          isDeprecated: false,
        },
      ],
    };

    const profileType: ExpandedType = {
      kind: 'OBJECT',
      name: 'Profile',
      fields: [
        {
          name: 'displayName',
          description: 'Display name',
          type: { kind: 'SCALAR', name: 'String' },
          typeString: 'String',
          isRequired: false,
          isList: false,
          isDeprecated: false,
        },
      ],
    };

    const getUserOperation: Operation = {
      name: 'getUser',
      operationType: 'query',
      description: 'Retrieve a user by id.',
      arguments: [
        {
          name: 'id',
          description: 'User id',
          isRequired: true,
          defaultValue: undefined,
          type: { kind: 'SCALAR', name: 'ID' },
          typeString: 'ID!',
        },
      ],
      returnType: makeTypeRef('User'),
      returnTypeString: 'User',
      directives: {
        docGroup: { name: 'Users' },
      },
      referencedTypes: ['User', 'Profile', 'ID'],
      isDeprecated: false,
      examples: [],
    };

    const model: DocModel = {
      sections: [
        {
          name: 'Users',
          order: 1,
          subsections: [
            {
              name: '',
              operations: [getUserOperation],
            },
          ],
        },
      ],
      types: [userType, profileType],
    };

    const generator = new LlmDocsGenerator({
      enabled: true,
      outputDir: '/tmp/llm-docs',
      strategy: 'chunked',
      includeExamples: false,
      generateManifest: true,
      singleFileName: 'api-reference.md',
      maxTypeDepth: 3,
      baseUrl: 'https://docs.example.com',
      apiName: 'Test API',
      apiDescription: 'Test description',
    });

    const { files } = generator.generate(model);
    const indexFile = files.find((file) => file.path === 'index.md');
    const chunkFile = files.find((file) => file.path === 'users.md');
    const operationFile = files.find((file) => file.path === 'users/get-user.md');
    const manifest = files.find((file) => file.path === 'llms.txt');

    expect(indexFile?.content).toContain('getUser(id: ID!): User');
    expect(indexFile?.content).toContain('[getUser](./users/get-user.md)');
    expect(chunkFile?.content).toContain('## Operations');
    expect(chunkFile?.content).toContain(
      '[getUser](https://docs.example.com/docs/api/users/get-user)'
    );
    expect(chunkFile?.content).toContain(
      '[getUser](https://docs.example.com/llm-docs/users/get-user.md)'
    );
    expect(chunkFile?.content).not.toContain('## Type Definitions');
    expect(operationFile?.content).toContain('# getUser');
    expect(manifest?.content).toContain('https://docs.example.com/llm-docs/index.md');
  });

  it('preserves section ordering when generating chunked files', () => {
    const makeOperation = (name: string, group: string): Operation => ({
      name,
      operationType: 'query',
      description: `${name} description`,
      arguments: [],
      returnType: { kind: 'SCALAR', name: 'String' },
      returnTypeString: 'String',
      directives: { docGroup: { name: group } },
      referencedTypes: ['String'],
      isDeprecated: false,
      examples: [],
    });

    const model: DocModel = {
      sections: [
        {
          name: 'Beta',
          order: 1,
          subsections: [{ name: '', operations: [makeOperation('betaQuery', 'Beta')] }],
        },
        {
          name: 'Alpha',
          order: 2,
          subsections: [{ name: '', operations: [makeOperation('alphaQuery', 'Alpha')] }],
        },
      ],
      types: [],
    };

    const generator = new LlmDocsGenerator({
      enabled: true,
      outputDir: '/tmp/llm-docs',
      strategy: 'chunked',
      includeExamples: false,
      generateManifest: false,
      singleFileName: 'api-reference.md',
      maxTypeDepth: 3,
    });

    const { files } = generator.generate(model);
    const chunkPaths = files.filter((file) => file.path.endsWith('.md')).map((file) => file.path);
    const indexFile = files.find((file) => file.path === 'index.md');

    expect(chunkPaths).toEqual([
      'index.md',
      'beta.md',
      'beta/beta-query.md',
      'alpha.md',
      'alpha/alpha-query.md',
    ]);
    expect(indexFile?.content).toContain('**Groups:** Beta, Alpha');
  });

  it('renders per-operation markdown with deduplicated type definitions and labeled examples', () => {
    const profileType: ExpandedType = {
      kind: 'OBJECT',
      name: 'Profile',
      fields: [
        {
          name: 'displayName',
          description: undefined,
          type: { kind: 'SCALAR', name: 'String' },
          typeString: 'String',
          isRequired: false,
          isList: false,
          isDeprecated: false,
        },
      ],
    };

    const filterInput: ExpandedType = {
      kind: 'INPUT_OBJECT',
      name: 'UserFilterInput',
      fields: [
        {
          name: 'status',
          description: 'Status filter',
          type: makeTypeRef('Status'),
          typeString: 'Status',
          isRequired: false,
          isList: false,
          isDeprecated: false,
        },
      ],
    };

    const statusEnum: ExpandedType = {
      kind: 'ENUM',
      name: 'Status',
      values: [
        {
          name: 'ACTIVE',
          description: 'Active user',
          isDeprecated: false,
        },
      ],
    };

    const userType: ExpandedType = {
      kind: 'OBJECT',
      name: 'User',
      fields: [
        {
          name: 'id',
          description: 'User ID',
          type: { kind: 'SCALAR', name: 'ID' },
          typeString: 'ID!',
          isRequired: true,
          isList: false,
          isDeprecated: false,
        },
        {
          name: 'profile',
          description: undefined,
          type: makeTypeRef('Profile'),
          typeString: 'Profile',
          isRequired: false,
          isList: false,
          isDeprecated: false,
        },
      ],
    };

    const getUserOperation: Operation = {
      name: 'getUser',
      operationType: 'query',
      description: 'Fetches a single user.',
      arguments: [
        {
          name: 'filter',
          description: 'Optional filters',
          isRequired: false,
          defaultValue: undefined,
          type: makeTypeRef('UserFilterInput'),
          typeString: 'UserFilterInput',
        },
      ],
      returnType: makeTypeRef('User'),
      returnTypeString: 'User',
      directives: { docGroup: { name: 'Users' } },
      referencedTypes: ['User', 'Profile', 'Profile', 'UserFilterInput', 'Status'],
      isDeprecated: false,
      examples: [
        {
          name: 'Default',
          query: 'query getUser { getUser { id } }',
          variables: { filter: { status: 'ACTIVE' } },
          response: { type: 'success', body: { data: { getUser: { id: '1' } } } },
        },
      ],
    };

    const model: DocModel = {
      sections: [
        {
          name: 'Users',
          order: 1,
          subsections: [{ name: '', operations: [getUserOperation] }],
        },
      ],
      types: [userType, profileType, filterInput, statusEnum],
    };

    const generator = new LlmDocsGenerator({
      enabled: true,
      outputDir: '/tmp/llm-docs',
      strategy: 'chunked',
      includeExamples: true,
      generateManifest: true,
      singleFileName: 'api-reference.md',
      maxTypeDepth: 3,
      apiName: 'Test API',
    });

    const { files } = generator.generate(model);
    const operationFile = files.find((file) => file.path === 'users/get-user.md');

    expect(operationFile?.content).toContain('## GraphQL Signature');
    expect(operationFile?.content).toContain('**Query:**');
    expect(operationFile?.content).toContain('**Variables:**');
    expect(operationFile?.content).toContain('**Response:**');
    expect(operationFile?.content).toContain('## Type Definitions');
    expect(operationFile?.content).toContain('No description available.');
    expect(operationFile?.content).toContain('See type definition: Profile.');
    expect((operationFile?.content.match(/### Profile/g) ?? []).length).toBe(1);
    expect(operationFile?.content).not.toContain('{#');
    expect(operationFile?.content).not.toContain('](#');
  });

  it('collectReferencedTypes returns the expected deduplicated set', () => {
    const userType: ExpandedType = {
      kind: 'OBJECT',
      name: 'User',
      fields: [
        {
          name: 'profile',
          description: 'Profile relation',
          type: makeTypeRef('Profile'),
          typeString: 'Profile',
          isRequired: false,
          isList: false,
          isDeprecated: false,
        },
      ],
    };

    const profileType: ExpandedType = {
      kind: 'OBJECT',
      name: 'Profile',
      fields: [],
    };

    const inputType: ExpandedType = {
      kind: 'INPUT_OBJECT',
      name: 'UserInput',
      fields: [
        {
          name: 'name',
          description: 'Name field',
          type: { kind: 'SCALAR', name: 'String' },
          typeString: 'String',
          isRequired: false,
          isList: false,
          isDeprecated: false,
        },
      ],
    };

    const operation: Operation = {
      name: 'createUser',
      operationType: 'mutation',
      description: 'Create a user.',
      arguments: [
        {
          name: 'input',
          description: 'User input',
          isRequired: true,
          type: makeTypeRef('UserInput'),
          typeString: 'UserInput!',
        },
      ],
      returnType: makeTypeRef('User'),
      returnTypeString: 'User',
      directives: { docGroup: { name: 'Users' } },
      referencedTypes: ['User', 'Profile', 'UserInput', 'User'],
      isDeprecated: false,
      examples: [],
    };

    const model: DocModel = {
      sections: [
        {
          name: 'Users',
          order: 1,
          subsections: [{ name: '', operations: [operation] }],
        },
      ],
      types: [userType, profileType, inputType],
    };

    const generator = new LlmDocsGenerator({
      enabled: true,
      outputDir: '/tmp/llm-docs',
      strategy: 'chunked',
      includeExamples: false,
      generateManifest: false,
      singleFileName: 'api-reference.md',
      maxTypeDepth: 3,
    });

    generator.generate(model);
    const referenced = (generator as any).collectReferencedTypes(operation) as string[];

    expect(referenced).toEqual(['UserInput', 'User', 'Profile']);
  });

  it('generates deterministic operation file slugs when operation names collide', () => {
    const queryPing: Operation = {
      name: 'ping',
      operationType: 'query',
      description: 'Query ping',
      arguments: [],
      returnType: { kind: 'SCALAR', name: 'String' },
      returnTypeString: 'String',
      directives: { docGroup: { name: 'Health' } },
      referencedTypes: ['String'],
      isDeprecated: false,
      examples: [],
    };

    const mutationPing: Operation = {
      ...queryPing,
      operationType: 'mutation',
      description: 'Mutation ping',
    };

    const model: DocModel = {
      sections: [
        {
          name: 'Health',
          order: 1,
          subsections: [{ name: '', operations: [queryPing, mutationPing] }],
        },
      ],
      types: [],
    };

    const generator = new LlmDocsGenerator({
      enabled: true,
      outputDir: '/tmp/llm-docs',
      strategy: 'chunked',
      includeExamples: false,
      generateManifest: false,
      singleFileName: 'api-reference.md',
      maxTypeDepth: 3,
    });

    const { files } = generator.generate(model);
    const paths = files.map((file) => file.path);

    expect(paths).toContain('health/ping.md');
    expect(paths).toContain('health/ping-mutation.md');
  });

  it('keeps llms.txt scoped to overview and group summaries', () => {
    const operation: Operation = {
      name: 'getUser',
      operationType: 'query',
      description: 'Get user',
      arguments: [],
      returnType: { kind: 'SCALAR', name: 'String' },
      returnTypeString: 'String',
      directives: { docGroup: { name: 'Users' } },
      referencedTypes: ['String'],
      isDeprecated: false,
      examples: [],
    };

    const model: DocModel = {
      sections: [
        {
          name: 'Users',
          order: 1,
          subsections: [{ name: '', operations: [operation] }],
        },
      ],
      types: [],
    };

    const generator = new LlmDocsGenerator({
      enabled: true,
      outputDir: '/tmp/llm-docs',
      strategy: 'chunked',
      includeExamples: false,
      generateManifest: true,
      singleFileName: 'api-reference.md',
      maxTypeDepth: 3,
      baseUrl: 'https://docs.example.com',
    });

    const { files } = generator.generate(model);
    const manifest = files.find((file) => file.path === 'llms.txt');

    expect(manifest?.content).toContain('https://docs.example.com/llm-docs/users.md');
    expect(manifest?.content).not.toContain('https://docs.example.com/llm-docs/users/get-user.md');
  });
});
