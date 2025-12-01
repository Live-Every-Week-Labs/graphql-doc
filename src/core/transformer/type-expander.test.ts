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

  it('expands scalar types', () => {
    const expander = new TypeExpander(mockTypes);
    const result = expander.expand('String');
    expect(result).toEqual({ kind: 'SCALAR', name: 'String' });
  });

  it('expands object types within depth limit', () => {
    const expander = new TypeExpander(mockTypes, 2);
    const result = expander.expand('User');
    expect(result.kind).toBe('OBJECT');
    if (result.kind === 'OBJECT') {
      expect(result.name).toBe('User');
      expect(result.fields).toHaveLength(3);
      expect(result.fields[0].name).toBe('id');
      expect(result.fields[0].type.kind).toBe('SCALAR');
    }
  });

  it('handles list types', () => {
    const expander = new TypeExpander(mockTypes);
    const result = expander.expand('[String!]!');
    expect(result.kind).toBe('LIST');
    if (result.kind === 'LIST') {
      expect(result.ofType.kind).toBe('SCALAR');
      expect((result.ofType as any).name).toBe('String');
    }
  });

  it('handles circular references', () => {
    const expander = new TypeExpander(mockTypes, 5);
    const result = expander.expand('User');

    // User -> bestFriend (User) -> Circular
    expect(result.kind).toBe('OBJECT');
    if (result.kind === 'OBJECT') {
      const bestFriendField = result.fields.find((f) => f.name === 'bestFriend');
      expect(bestFriendField).toBeDefined();
      expect(bestFriendField?.type.kind).toBe('CIRCULAR_REF');
      expect((bestFriendField?.type as any).ref).toBe('User');
    }
  });

  it('handles indirect circular references', () => {
    const expander = new TypeExpander(mockTypes, 5);
    const result = expander.expand('User');

    // User -> posts -> Post -> author (User) -> Circular
    expect(result.kind).toBe('OBJECT');
    if (result.kind === 'OBJECT') {
      const postsField = result.fields.find((f) => f.name === 'posts');
      expect(postsField?.type.kind).toBe('LIST');
      const postType = (postsField?.type as any).ofType;
      expect(postType.kind).toBe('OBJECT');
      const authorField = postType.fields.find((f: any) => f.name === 'author');
      expect(authorField.type.kind).toBe('CIRCULAR_REF');
      expect(authorField.type.ref).toBe('User');
    }
  });

  it('enforces max depth with collapsible', () => {
    // Depth 0: User
    // Depth 1: Post (via posts)
    // Depth 2: Comment (via comments) -> Should be collapsible if maxDepth is 2
    const expander = new TypeExpander(mockTypes, 2);
    const result = expander.expand('User');

    // User (0) -> posts -> Post (1) -> comments -> Comment (2)
    // Wait, expand('User') starts at depth 0.
    // User fields are at depth 1.
    // Post fields are at depth 2.
    // Comment fields are at depth 3.

    // If maxDepth is 2:
    // User (0) - expanded
    //   posts -> Post (1) - expanded
    //     comments -> Comment (2) - collapsible?

    // Let's trace logic:
    // expand('User', 0) -> OBJECT. Check 0 >= 2? No.
    //   fields:
    //     posts: expand('[Post!]!', 1) -> LIST -> expand('Post', 1)
    //       expand('Post', 1) -> OBJECT. Check 1 >= 2? No.
    //         fields:
    //           comments: expand('[Comment!]!', 2) -> LIST -> expand('Comment', 2)
    //             expand('Comment', 2) -> OBJECT. Check 2 >= 2? Yes. -> Collapsible.

    expect(result.kind).toBe('OBJECT');
    if (result.kind === 'OBJECT') {
      const postsField = result.fields.find((f) => f.name === 'posts');
      const postType = (postsField?.type as any).ofType;
      const commentsField = postType.fields.find((f: any) => f.name === 'comments');
      const commentType = (commentsField?.type as any).ofType;

      expect(commentType.kind).toBe('OBJECT');
      expect(commentType.isCollapsible).toBe(true);
      expect(commentType.fields).toHaveLength(0);
    }
  });

  describe('showCircularReferences config', () => {
    it('returns CIRCULAR_REF when showCircularReferences is true (default)', () => {
      const expander = new TypeExpander(mockTypes, 5, 2, true);
      const result = expander.expand('User');

      expect(result.kind).toBe('OBJECT');
      if (result.kind === 'OBJECT') {
        const bestFriendField = result.fields.find((f) => f.name === 'bestFriend');
        expect(bestFriendField?.type.kind).toBe('CIRCULAR_REF');
        expect((bestFriendField?.type as any).ref).toBe('User');
      }
    });

    it('returns TYPE_REF when showCircularReferences is false', () => {
      const expander = new TypeExpander(mockTypes, 5, 2, false);
      const result = expander.expand('User');

      expect(result.kind).toBe('OBJECT');
      if (result.kind === 'OBJECT') {
        const bestFriendField = result.fields.find((f) => f.name === 'bestFriend');
        expect(bestFriendField?.type.kind).toBe('TYPE_REF');
        expect((bestFriendField?.type as any).name).toBe('User');
        expect((bestFriendField?.type as any).link).toBe('#user');
      }
    });

    it('returns TYPE_REF for indirect circular refs when showCircularReferences is false', () => {
      const expander = new TypeExpander(mockTypes, 5, 2, false);
      const result = expander.expand('User');

      expect(result.kind).toBe('OBJECT');
      if (result.kind === 'OBJECT') {
        const postsField = result.fields.find((f) => f.name === 'posts');
        const postType = (postsField?.type as any).ofType;
        const authorField = postType.fields.find((f: any) => f.name === 'author');
        expect(authorField.type.kind).toBe('TYPE_REF');
        expect(authorField.type.name).toBe('User');
      }
    });
  });

  describe('defaultLevels config', () => {
    it('marks types at depth >= defaultLevels as collapsible but with fields', () => {
      // maxDepth=5, defaultLevels=1
      // User (depth 0) -> not collapsible
      // Post (depth 1) -> collapsible (>= defaultLevels) but has fields
      const expander = new TypeExpander(mockTypes, 5, 1, true);
      const result = expander.expand('User');

      expect(result.kind).toBe('OBJECT');
      if (result.kind === 'OBJECT') {
        expect(result.isCollapsible).toBe(false); // depth 0 < defaultLevels 1

        const postsField = result.fields.find((f) => f.name === 'posts');
        const postType = (postsField?.type as any).ofType;
        expect(postType.kind).toBe('OBJECT');
        expect(postType.isCollapsible).toBe(true); // depth 1 >= defaultLevels 1
        expect(postType.fields.length).toBeGreaterThan(0); // Still has fields (not at maxDepth)
      }
    });

    it('types below defaultLevels are not collapsible', () => {
      // maxDepth=5, defaultLevels=3
      // User (depth 0), Post (depth 1), Comment (depth 2) -> all not collapsible
      const expander = new TypeExpander(mockTypes, 5, 3, true);
      const result = expander.expand('User');

      expect(result.kind).toBe('OBJECT');
      if (result.kind === 'OBJECT') {
        expect(result.isCollapsible).toBe(false); // depth 0

        const postsField = result.fields.find((f) => f.name === 'posts');
        const postType = (postsField?.type as any).ofType;
        expect(postType.isCollapsible).toBe(false); // depth 1

        const commentsField = postType.fields.find((f: any) => f.name === 'comments');
        const commentType = (commentsField?.type as any).ofType;
        expect(commentType.isCollapsible).toBe(false); // depth 2
      }
    });

    it('defaultLevels defaults to 2', () => {
      // Only passing maxDepth, defaultLevels should be 2
      const expander = new TypeExpander(mockTypes, 5);
      const result = expander.expand('User');

      // depth 0, 1 -> not collapsible
      // depth >= 2 -> collapsible
      if (result.kind === 'OBJECT') {
        expect(result.isCollapsible).toBe(false); // depth 0

        const postsField = result.fields.find((f) => f.name === 'posts');
        const postType = (postsField?.type as any).ofType;
        expect(postType.isCollapsible).toBe(false); // depth 1

        const commentsField = postType.fields.find((f: any) => f.name === 'comments');
        const commentType = (commentsField?.type as any).ofType;
        expect(commentType.isCollapsible).toBe(true); // depth 2
      }
    });

    it('types at maxDepth still have empty fields regardless of defaultLevels', () => {
      // maxDepth=2, defaultLevels=1
      // Comment at depth 2 should have empty fields (at maxDepth)
      const expander = new TypeExpander(mockTypes, 2, 1, true);
      const result = expander.expand('User');

      if (result.kind === 'OBJECT') {
        const postsField = result.fields.find((f) => f.name === 'posts');
        const postType = (postsField?.type as any).ofType;
        const commentsField = postType.fields.find((f: any) => f.name === 'comments');
        const commentType = (commentsField?.type as any).ofType;

        expect(commentType.isCollapsible).toBe(true);
        expect(commentType.fields).toHaveLength(0); // At maxDepth - empty fields
      }
    });
  });
});
