import { describe, it, expect } from 'vitest';
import { DirectiveExtractor } from './directive-extractor';
import { parse, ObjectTypeDefinitionNode } from 'graphql';

describe('DirectiveExtractor', () => {
  const extractor = new DirectiveExtractor();

  it('should extract @docGroup directive', () => {
    const sdl = `
      type Query {
        users: [User] @docGroup(name: "User Management", order: 1, subsection: "Retrieval")
      }
    `;
    const ast = parse(sdl);
    const field = (ast.definitions[0] as ObjectTypeDefinitionNode).fields![0];

    const directives = extractor.extract(field);

    expect(directives.docGroup).toEqual({
      name: 'User Management',
      order: 1,
      subsection: 'Retrieval',
    });
  });

  it('should extract sidebarTitle from @docGroup', () => {
    const sdl = `
      type Query {
        users: [User] @docGroup(name: "Users", sidebarTitle: "List Users")
      }
    `;
    const ast = parse(sdl);
    const field = (ast.definitions[0] as ObjectTypeDefinitionNode).fields![0];

    const directives = extractor.extract(field);

    expect(directives.docGroup).toEqual({
      name: 'Users',
      displayLabel: 'List Users',
      sidebarTitle: 'List Users',
    });
  });

  it('should extract displayLabel from @docGroup', () => {
    const sdl = `
      type Query {
        users: [User] @docGroup(name: "Users", displayLabel: "List Users")
      }
    `;
    const ast = parse(sdl);
    const field = (ast.definitions[0] as ObjectTypeDefinitionNode).fields![0];

    const directives = extractor.extract(field);

    expect(directives.docGroup).toEqual({
      name: 'Users',
      displayLabel: 'List Users',
    });
  });

  it('should extract @docPriority directive', () => {
    const sdl = `
      type Query {
        users: [User] @docPriority(level: 5)
      }
    `;
    const ast = parse(sdl);
    const field = (ast.definitions[0] as ObjectTypeDefinitionNode).fields![0];

    const directives = extractor.extract(field);

    expect(directives.docPriority).toEqual({
      level: 5,
    });
  });

  it('should extract @docTags directive', () => {
    const sdl = `
      type Query {
        users: [User] @docTags(tags: ["users", "core"])
      }
    `;
    const ast = parse(sdl);
    const field = (ast.definitions[0] as ObjectTypeDefinitionNode).fields![0];

    const directives = extractor.extract(field);

    expect(directives.docTags).toEqual({
      tags: ['users', 'core'],
    });
  });

  it('should extract @docIgnore directive', () => {
    const sdl = `
      type Query {
        users: [User] @docIgnore
      }
    `;
    const ast = parse(sdl);
    const field = (ast.definitions[0] as ObjectTypeDefinitionNode).fields![0];

    const directives = extractor.extract(field);

    expect(directives.docIgnore).toBe(true);
  });

  it('should handle multiple directives', () => {
    const sdl = `
      type Query {
        users: [User] 
          @docGroup(name: "Users", order: 1)
          @docPriority(level: 2)
      }
    `;
    const ast = parse(sdl);
    const field = (ast.definitions[0] as ObjectTypeDefinitionNode).fields![0];

    const directives = extractor.extract(field);

    expect(directives.docGroup).toEqual({ name: 'Users', order: 1 });
    expect(directives.docPriority).toEqual({ level: 2 });
  });

  it('should ignore invalid @docGroup usage', () => {
    const sdl = `
      type Query {
        users: [User] @docGroup(name: 123)
      }
    `;
    const ast = parse(sdl);
    const field = (ast.definitions[0] as ObjectTypeDefinitionNode).fields![0];
    const directives = extractor.extract(field);
    expect(directives.docGroup).toBeUndefined();
  });

  it('reports warnings for unknown @docGroup arguments', () => {
    const warnings: string[] = [];
    const warningExtractor = new DirectiveExtractor((warning) => {
      warnings.push(`Invalid @${warning.directive} usage: ${warning.message}`);
    });

    const sdl = `
      type Query {
        users: [User] @docGroup(name: "Users", typo: "invalid")
      }
    `;
    const ast = parse(sdl);
    const field = (ast.definitions[0] as ObjectTypeDefinitionNode).fields![0];
    const directives = warningExtractor.extract(field);

    expect(directives.docGroup).toBeUndefined();
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('Invalid @docGroup usage:');
    expect(warnings[0]).toContain('typo');
  });

  it('rejects empty @docGroup names', () => {
    const warnings: string[] = [];
    const warningExtractor = new DirectiveExtractor((warning) => {
      warnings.push(`Invalid @${warning.directive} usage: ${warning.message}`);
    });

    const sdl = `
      type Query {
        users: [User] @docGroup(name: "")
      }
    `;
    const ast = parse(sdl);
    const field = (ast.definitions[0] as ObjectTypeDefinitionNode).fields![0];
    const directives = warningExtractor.extract(field);

    expect(directives.docGroup).toBeUndefined();
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('Invalid @docGroup usage:');
  });

  it('reports warnings for invalid directive usage', () => {
    const warnings: string[] = [];
    const warningExtractor = new DirectiveExtractor((warning) => {
      warnings.push(`Invalid @${warning.directive} usage: ${warning.message}`);
    });
    const sdl = `
      type Query {
        users: [User] @docPriority(level: "high")
      }
    `;
    const ast = parse(sdl);
    const field = (ast.definitions[0] as ObjectTypeDefinitionNode).fields![0];
    warningExtractor.extract(field);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('Invalid @docPriority usage:');
  });

  it('should ignore invalid @docPriority usage', () => {
    const sdl = `
      type Query {
        users: [User] @docPriority(level: "high")
      }
    `;
    const ast = parse(sdl);
    const field = (ast.definitions[0] as ObjectTypeDefinitionNode).fields![0];
    const directives = extractor.extract(field);
    expect(directives.docPriority).toBeUndefined();
  });

  it('should ignore invalid @docTags usage', () => {
    const sdl = `
      type Query {
        users: [User] @docTags(tags: "not-an-array")
      }
    `;
    const ast = parse(sdl);
    const field = (ast.definitions[0] as ObjectTypeDefinitionNode).fields![0];
    const directives = extractor.extract(field);
    expect(directives.docTags).toBeUndefined();
  });
});
