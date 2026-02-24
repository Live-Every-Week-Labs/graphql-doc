import { describe, it, expect } from 'vitest';
import { TypeExpander } from './type-expander';
import { TypeDefinition } from '../parser/types';

describe('TypeExpander', () => {
  const mockTypes: TypeDefinition[] = [
    { kind: 'SCALAR', name: 'String' },
    { kind: 'SCALAR', name: 'Int' },
    {
      kind: 'OBJECT',
      name: 'User',
      fields: [
        { name: 'id', type: 'String!', isRequired: true, isList: false, isDeprecated: false },
        { name: 'posts', type: '[Post!]!', isRequired: true, isList: true, isDeprecated: false },
        { name: 'bestFriend', type: 'User', isRequired: false, isList: false, isDeprecated: false },
      ],
    },
    {
      kind: 'OBJECT',
      name: 'Post',
      fields: [
        { name: 'id', type: 'String!', isRequired: true, isList: false, isDeprecated: false },
        { name: 'author', type: 'User!', isRequired: true, isList: false, isDeprecated: false },
        {
          name: 'comments',
          type: '[Comment!]!',
          isRequired: true,
          isList: true,
          isDeprecated: false,
        },
      ],
    },
    {
      kind: 'OBJECT',
      name: 'Comment',
      fields: [
        { name: 'id', type: 'String!', isRequired: true, isList: false, isDeprecated: false },
        { name: 'author', type: 'User!', isRequired: true, isList: false, isDeprecated: false },
      ],
    },
  ];

  it('returns TYPE_REF for known named types', () => {
    const expander = new TypeExpander(mockTypes);
    const result = expander.expand('String');
    expect(result.kind).toBe('TYPE_REF');
    if (result.kind === 'TYPE_REF') {
      expect(result.name).toBe('String');
      expect(result.link).toBe('#string');
    }
  });

  it('falls back to SCALAR for unknown types', () => {
    const expander = new TypeExpander(mockTypes);
    const result = expander.expand('UnknownType');
    expect(result).toEqual({ kind: 'SCALAR', name: 'UnknownType' });
  });

  it('handles list types', () => {
    const expander = new TypeExpander(mockTypes);
    const result = expander.expand('[String!]!');
    expect(result.kind).toBe('LIST');
    if (result.kind === 'LIST') {
      expect(result.ofType.kind).toBe('TYPE_REF');
      if (result.ofType.kind === 'TYPE_REF') {
        expect(result.ofType.name).toBe('String');
      }
    }
  });

  it('expands type definitions with referenced fields', () => {
    const expander = new TypeExpander(mockTypes);
    const result = expander.expandDefinition('User');
    expect(result.kind).toBe('OBJECT');
    if (result.kind === 'OBJECT') {
      expect(result.name).toBe('User');
      expect(result.fields).toHaveLength(3);
      const postsField = result.fields.find((f) => f.name === 'posts');
      expect(postsField?.type.kind).toBe('LIST');
      if (postsField?.type.kind === 'LIST') {
        const postType = postsField.type.ofType;
        expect(postType.kind).toBe('OBJECT');
        if (postType.kind === 'OBJECT') {
          expect(postType.name).toBe('Post');
        }
      }
    }
  });

  it('limits inline expansion depth when maxDepth is configured', () => {
    const expander = new TypeExpander(mockTypes, true, 2);
    const result = expander.expandDefinition('User');
    expect(result.kind).toBe('OBJECT');

    if (result.kind !== 'OBJECT') {
      return;
    }

    const postsField = result.fields.find((f) => f.name === 'posts');
    expect(postsField?.type.kind).toBe('LIST');
    if (postsField?.type.kind !== 'LIST' || postsField.type.ofType.kind !== 'OBJECT') {
      return;
    }

    const commentsField = postsField.type.ofType.fields.find((f) => f.name === 'comments');
    expect(commentsField?.type.kind).toBe('LIST');
    if (commentsField?.type.kind === 'LIST') {
      expect(commentsField.type.ofType.kind).toBe('TYPE_REF');
      if (commentsField.type.ofType.kind === 'TYPE_REF') {
        expect(commentsField.type.ofType.name).toBe('Comment');
      }
    }
  });

  it('marks deeper expanded objects as collapsible based on defaultLevels', () => {
    const expander = new TypeExpander(mockTypes, true, 5, 1);
    const result = expander.expandDefinition('User');
    expect(result.kind).toBe('OBJECT');

    if (result.kind !== 'OBJECT') {
      return;
    }

    const postsField = result.fields.find((f) => f.name === 'posts');
    expect(postsField?.type.kind).toBe('LIST');
    if (postsField?.type.kind !== 'LIST' || postsField.type.ofType.kind !== 'OBJECT') {
      return;
    }

    expect(postsField.type.ofType.isCollapsible).toBe(false);

    const commentsField = postsField.type.ofType.fields.find((f) => f.name === 'comments');
    expect(commentsField?.type.kind).toBe('LIST');
    if (commentsField?.type.kind === 'LIST' && commentsField.type.ofType.kind === 'OBJECT') {
      expect(commentsField.type.ofType.isCollapsible).toBe(true);
    }
  });

  describe('showCircularReferences config', () => {
    it('returns CIRCULAR_REF when showCircularReferences is true (default)', () => {
      const expander = new TypeExpander(mockTypes, true);
      const result = expander.expandDefinition('User');

      expect(result.kind).toBe('OBJECT');
      if (result.kind === 'OBJECT') {
        const bestFriendField = result.fields.find((f) => f.name === 'bestFriend');
        expect(bestFriendField?.type.kind).toBe('CIRCULAR_REF');
        if (bestFriendField?.type.kind === 'CIRCULAR_REF') {
          expect(bestFriendField.type.ref).toBe('User');
        }
      }
    });

    it('returns TYPE_REF when showCircularReferences is false', () => {
      const expander = new TypeExpander(mockTypes, false);
      const result = expander.expandDefinition('User');

      expect(result.kind).toBe('OBJECT');
      if (result.kind === 'OBJECT') {
        const bestFriendField = result.fields.find((f) => f.name === 'bestFriend');
        expect(bestFriendField?.type.kind).toBe('TYPE_REF');
        if (bestFriendField?.type.kind === 'TYPE_REF') {
          expect(bestFriendField.type.name).toBe('User');
          expect(bestFriendField.type.link).toBe('#user');
        }
      }
    });
  });

  it('filters fields and enum values marked with @docIgnore', () => {
    const types: TypeDefinition[] = [
      { kind: 'SCALAR', name: 'String' },
      {
        kind: 'ENUM',
        name: 'Role',
        enumValues: [
          { name: 'ADMIN', isDeprecated: false },
          {
            name: 'INTERNAL',
            isDeprecated: false,
            directives: { docIgnore: true },
          },
        ],
      },
      {
        kind: 'OBJECT',
        name: 'User',
        fields: [
          { name: 'id', type: 'String!', isRequired: true, isList: false, isDeprecated: false },
          {
            name: 'device_id',
            type: 'String',
            isRequired: false,
            isList: false,
            isDeprecated: false,
            directives: { docIgnore: true },
          },
        ],
      },
    ];

    const expander = new TypeExpander(types);
    const user = expander.expandDefinition('User');
    expect(user.kind).toBe('OBJECT');
    if (user.kind === 'OBJECT') {
      expect(user.fields.some((f) => f.name === 'device_id')).toBe(false);
    }

    const role = expander.expandDefinition('Role');
    expect(role.kind).toBe('ENUM');
    if (role.kind === 'ENUM') {
      expect(role.values.some((v) => v.name === 'INTERNAL')).toBe(false);
    }
  });

  it('treats @docIgnore types as scalars in references', () => {
    const types: TypeDefinition[] = [
      { kind: 'SCALAR', name: 'String' },
      { kind: 'OBJECT', name: 'Hidden', fields: [], directives: { docIgnore: true } },
    ];
    const expander = new TypeExpander(types);
    const result = expander.expand('Hidden');
    expect(result).toEqual({ kind: 'SCALAR', name: 'Hidden' });
  });
});
