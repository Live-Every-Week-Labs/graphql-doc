import { describe, it, expect } from 'vitest';
import { MdxRenderer } from './mdx-renderer.js';
import { Operation } from '../../transformer/types.js';

describe('MdxRenderer', () => {
  const renderer = new MdxRenderer();

  const mockOperation: Operation = {
    name: 'getUser',
    operationType: 'query',
    description: 'Retrieves a user by ID.',
    arguments: [
      {
        name: 'id',
        type: { kind: 'SCALAR', name: 'ID' },
        description: 'The user ID',
        isRequired: true,
      },
    ],
    returnType: { kind: 'SCALAR', name: 'User' },
    directives: {
      docGroup: { name: 'Users', order: 1 },
    },
    referencedTypes: [],
    isDeprecated: false,
    examples: [],
  };

  it('renders a basic operation', () => {
    const output = renderer.renderOperation(mockOperation);
    expect(output).toContain('export const operation');
    expect(output).toContain('<OperationView');
    expect(output).toContain('"description": "Retrieves a user by ID."');
  });

  it('renders raw description when unsafeDescriptionMdx is enabled', () => {
    const output = renderer.renderOperation(mockOperation, { unsafeDescriptionMdx: true });
    expect(output).toContain('Retrieves a user by ID.');
  });

  it('sanitizes unsafe markdown descriptions before rendering', () => {
    const output = renderer.renderOperation(
      {
        ...mockOperation,
        description: 'Safe text<script>alert(1)</script><a href="javascript:alert(2)">x</a>',
      },
      { unsafeDescriptionMdx: true }
    );

    const unsafeSectionMatch = output.match(
      /<OperationView[\s\S]*?>\n([\s\S]*?)\n<\/OperationView>/
    );
    const unsafeSection = unsafeSectionMatch?.[1] ?? '';

    expect(output).toContain('Safe text');
    expect(unsafeSection).toBe('Safe text<a>x</a>');
    expect(unsafeSection).not.toContain('<script>');
    expect(unsafeSection).not.toContain('javascript:');
  });

  it('blocks common XSS vectors in unsafe markdown descriptions', () => {
    const output = renderer.renderOperation(
      {
        ...mockOperation,
        description: [
          'Safe',
          '<script>alert(1)</script>',
          '<iframe src="https://evil.test"></iframe>',
          '<svg onload=alert(1)><circle/></svg>',
          '<img src="https://example.com/img.png" onerror=alert(1)>',
          '<a href="javascript:alert(1)">bad-js</a>',
          '<a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">bad-data</a>',
          '<div onclick=alert(1)>click-me</div>',
        ].join(''),
      },
      { unsafeDescriptionMdx: true }
    );

    const unsafeSectionMatch = output.match(
      /<OperationView[\s\S]*?>\n([\s\S]*?)\n<\/OperationView>/
    );
    const unsafeSection = unsafeSectionMatch?.[1] ?? '';

    expect(unsafeSection).toContain('Safe');
    expect(unsafeSection).not.toContain('<script');
    expect(unsafeSection).not.toContain('<iframe');
    expect(unsafeSection).not.toContain('<svg');
    expect(unsafeSection).not.toContain('onload=');
    expect(unsafeSection).not.toContain('onerror=');
    expect(unsafeSection).not.toContain('onclick=');
    expect(unsafeSection).not.toContain('javascript:');
    expect(unsafeSection).not.toContain('data:text/html');
  });

  it('preserves safe html tags and links in unsafe markdown descriptions', () => {
    const output = renderer.renderOperation(
      {
        ...mockOperation,
        description:
          '<h2>API Notes</h2><p><em>Safe</em> <strong>content</strong> <code>ok()</code></p>' +
          '<a href="https://example.com/docs">Docs</a><table><tr><td>Cell</td></tr></table>',
      },
      { unsafeDescriptionMdx: true }
    );

    const unsafeSectionMatch = output.match(
      /<OperationView[\s\S]*?>\n([\s\S]*?)\n<\/OperationView>/
    );
    const unsafeSection = unsafeSectionMatch?.[1] ?? '';

    expect(unsafeSection).toContain('<h2>API Notes</h2>');
    expect(unsafeSection).toContain('<em>Safe</em>');
    expect(unsafeSection).toContain('<strong>content</strong>');
    expect(unsafeSection).toContain('<code>ok()</code>');
    expect(unsafeSection).toContain('<a href="https://example.com/docs">Docs</a>');
    expect(unsafeSection).toContain('<table>');
  });

  it('supports custom export names and heading levels', () => {
    const output = renderer.renderOperation(mockOperation, {
      exportName: 'operation_get_user',
      exportConst: false,
      headingLevel: 4,
    });
    expect(output).toContain('const operation_get_user');
    expect(output).toMatch(/headingLevel=\{\s*4\s*\}/);
  });

  it('renders operation with a data reference when provided', () => {
    const output = renderer.renderOperation(mockOperation, {
      dataReference: "operationsByType['query']['getUser']",
    });
    expect(output).toContain("export const operation = operationsByType['query']['getUser']");
  });
});
