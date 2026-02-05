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
        docGroup: { name: 'Users', order: 1 },
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
    const manifest = files.find((file) => file.path === 'llms.txt');

    expect(indexFile?.content).toContain('getUser(id: ID!): User');
    expect(chunkFile?.content).toContain('**Profile fields:**');
    expect(manifest?.content).toContain('https://docs.example.com/llm-docs/index.md');
  });
});
