import { describe, it, expect, beforeEach } from 'vitest';
import { DocusaurusAdapter } from './docusaurus-adapter.js';
import { DocModel, Operation } from '../../transformer/types.js';

/**
 * Creates a minimal Operation object for testing
 */
function createMockOperation(overrides: Partial<Operation> = {}): Operation {
  return {
    name: 'getUser',
    operationType: 'query',
    description: 'Get a user by ID',
    arguments: [],
    returnType: { kind: 'SCALAR', name: 'User' },
    directives: {},
    referencedTypes: [],
    isDeprecated: false,
    examples: [],
    ...overrides,
  };
}

/**
 * Creates a minimal DocModel for testing
 */
function createMockDocModel(operations: Operation[]): DocModel {
  return {
    sections: [
      {
        name: 'Users',
        order: 1,
        subsections: [
          {
            name: '',
            operations,
          },
        ],
      },
    ],
    types: [],
  };
}

/**
 * Extracts front matter from generated MDX content
 */
function extractFrontMatter(mdx: string): string {
  const match = mdx.match(/^---\n([\s\S]*?)\n---/);
  return match ? match[1] : '';
}

describe('DocusaurusAdapter', () => {
  let adapter: DocusaurusAdapter;

  beforeEach(() => {
    adapter = new DocusaurusAdapter();
  });

  describe('generateFrontMatter - YAML escaping', () => {
    it('should generate valid front matter for simple operation names', () => {
      const op = createMockOperation({ name: 'getUserById' });
      const model = createMockDocModel([op]);

      const files = adapter.adapt(model);
      const mdxFile = files.find((f) => f.path.endsWith('.mdx'));

      expect(mdxFile).toBeDefined();
      const frontMatter = extractFrontMatter(mdxFile!.content);

      expect(frontMatter).toContain('id: get-user-by-id');
      expect(frontMatter).toContain('title: getUserById');
      expect(frontMatter).toContain('sidebar_label: getUserById');
    });

    it('should escape operation names with colons', () => {
      const op = createMockOperation({ name: 'User: GetDetails' });
      const model = createMockDocModel([op]);

      const files = adapter.adapt(model);
      const mdxFile = files.find((f) => f.path.endsWith('.mdx'));

      expect(mdxFile).toBeDefined();
      const frontMatter = extractFrontMatter(mdxFile!.content);

      // Should be quoted because of colon
      expect(frontMatter).toContain('title: "User: GetDetails"');
      expect(frontMatter).toContain('sidebar_label: "User: GetDetails"');
    });

    it('should escape operation names with quotes', () => {
      const op = createMockOperation({ name: 'Get "Special" User' });
      const model = createMockDocModel([op]);

      const files = adapter.adapt(model);
      const mdxFile = files.find((f) => f.path.endsWith('.mdx'));

      expect(mdxFile).toBeDefined();
      const frontMatter = extractFrontMatter(mdxFile!.content);

      // Should escape the quotes
      expect(frontMatter).toContain('title: "Get \\"Special\\" User"');
    });

    it('should escape operation names with hash character', () => {
      const op = createMockOperation({ name: 'User #1 Query' });
      const model = createMockDocModel([op]);

      const files = adapter.adapt(model);
      const mdxFile = files.find((f) => f.path.endsWith('.mdx'));

      expect(mdxFile).toBeDefined();
      const frontMatter = extractFrontMatter(mdxFile!.content);

      // Should be quoted because of hash
      expect(frontMatter).toContain('title: "User #1 Query"');
    });

    it('should handle tags with special characters', () => {
      const op = createMockOperation({
        name: 'getUser',
        directives: {
          docTags: {
            tags: ['api', 'user-management', 'tag with "quotes"'],
          },
        },
      });
      const model = createMockDocModel([op]);

      const files = adapter.adapt(model);
      const mdxFile = files.find((f) => f.path.endsWith('.mdx'));

      expect(mdxFile).toBeDefined();
      const frontMatter = extractFrontMatter(mdxFile!.content);

      // All tags should be properly escaped
      expect(frontMatter).toContain('tags: ["api", "user-management", "tag with \\"quotes\\""]');
    });

    it('should handle tags with colons', () => {
      const op = createMockOperation({
        name: 'getUser',
        directives: {
          docTags: {
            tags: ['scope:admin', 'level:high'],
          },
        },
      });
      const model = createMockDocModel([op]);

      const files = adapter.adapt(model);
      const mdxFile = files.find((f) => f.path.endsWith('.mdx'));

      expect(mdxFile).toBeDefined();
      const frontMatter = extractFrontMatter(mdxFile!.content);

      expect(frontMatter).toContain('tags: ["scope:admin", "level:high"]');
    });

    it('should prevent YAML injection through malicious tags', () => {
      const op = createMockOperation({
        name: 'getUser',
        directives: {
          docTags: {
            tags: ['legitimate", "injected": "value'],
          },
        },
      });
      const model = createMockDocModel([op]);

      const files = adapter.adapt(model);
      const mdxFile = files.find((f) => f.path.endsWith('.mdx'));

      expect(mdxFile).toBeDefined();
      const frontMatter = extractFrontMatter(mdxFile!.content);

      // The malicious content should be escaped, not interpreted as YAML
      expect(frontMatter).toContain('tags: ["legitimate\\", \\"injected\\": \\"value"]');
      // Should NOT contain unescaped injection
      expect(frontMatter).not.toMatch(/injected":\s*"value/);
    });

    it('should prevent YAML injection through operation names with newlines', () => {
      const op = createMockOperation({
        name: 'getUser\nmalicious_key: malicious_value',
      });
      const model = createMockDocModel([op]);

      const files = adapter.adapt(model);
      const mdxFile = files.find((f) => f.path.endsWith('.mdx'));

      expect(mdxFile).toBeDefined();
      const frontMatter = extractFrontMatter(mdxFile!.content);

      // Should escape the newline, preventing injection
      expect(frontMatter).toContain('title: "getUser\\nmalicious_key: malicious_value"');
      // Should NOT have a real newline in the title
      expect(frontMatter).not.toMatch(/title: getUser\nmalicious_key/);
    });

    it('should handle empty tags array gracefully', () => {
      const op = createMockOperation({
        name: 'getUser',
        directives: {
          docTags: {
            tags: [],
          },
        },
      });
      const model = createMockDocModel([op]);

      const files = adapter.adapt(model);
      const mdxFile = files.find((f) => f.path.endsWith('.mdx'));

      expect(mdxFile).toBeDefined();
      const frontMatter = extractFrontMatter(mdxFile!.content);

      // Should not include tags line when empty
      expect(frontMatter).not.toContain('tags:');
    });

    it('should handle operation names with backslashes', () => {
      const op = createMockOperation({ name: 'path\\to\\operation' });
      const model = createMockDocModel([op]);

      const files = adapter.adapt(model);
      const mdxFile = files.find((f) => f.path.endsWith('.mdx'));

      expect(mdxFile).toBeDefined();
      const frontMatter = extractFrontMatter(mdxFile!.content);

      // Should escape backslashes
      expect(frontMatter).toContain('title: "path\\\\to\\\\operation"');
    });
  });

  describe('slugify', () => {
    it('should convert camelCase to kebab-case', () => {
      const op = createMockOperation({ name: 'getUserById' });
      const model = createMockDocModel([op]);

      const files = adapter.adapt(model);
      const mdxFile = files.find((f) => f.path.endsWith('.mdx'));

      expect(mdxFile).toBeDefined();
      const frontMatter = extractFrontMatter(mdxFile!.content);

      expect(frontMatter).toContain('id: get-user-by-id');
    });

    it('should remove special characters from id', () => {
      const op = createMockOperation({ name: 'get"User#1' });
      const model = createMockDocModel([op]);

      const files = adapter.adapt(model);
      const mdxFile = files.find((f) => f.path.endsWith('.mdx'));

      expect(mdxFile).toBeDefined();
      const frontMatter = extractFrontMatter(mdxFile!.content);

      // ID should be sanitized - only alphanumeric and hyphens
      expect(frontMatter).toContain('id: get-user-1');
    });
  });
});
