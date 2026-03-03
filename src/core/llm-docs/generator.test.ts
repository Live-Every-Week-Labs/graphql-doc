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
});
