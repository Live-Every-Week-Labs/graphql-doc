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
      expect((result.ofType as any).name).toBe('String');
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
      const postType = (postsField?.type as any).ofType;
      expect(postType.kind).toBe('TYPE_REF');
      expect(postType.name).toBe('Post');
    }
  });

  describe('showCircularReferences config', () => {
    it('returns CIRCULAR_REF when showCircularReferences is true (default)', () => {
      const expander = new TypeExpander(mockTypes, 5, 2, true);
      const result = expander.expandDefinition('User');

      expect(result.kind).toBe('OBJECT');
      if (result.kind === 'OBJECT') {
        const bestFriendField = result.fields.find((f) => f.name === 'bestFriend');
        expect(bestFriendField?.type.kind).toBe('CIRCULAR_REF');
        expect((bestFriendField?.type as any).ref).toBe('User');
      }
    });

    it('returns TYPE_REF when showCircularReferences is false', () => {
      const expander = new TypeExpander(mockTypes, 5, 2, false);
      const result = expander.expandDefinition('User');

      expect(result.kind).toBe('OBJECT');
      if (result.kind === 'OBJECT') {
        const bestFriendField = result.fields.find((f) => f.name === 'bestFriend');
        expect(bestFriendField?.type.kind).toBe('TYPE_REF');
        expect((bestFriendField?.type as any).name).toBe('User');
        expect((bestFriendField?.type as any).link).toBe('#user');
      }
    });
  });
});
