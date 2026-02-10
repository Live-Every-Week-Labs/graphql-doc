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
