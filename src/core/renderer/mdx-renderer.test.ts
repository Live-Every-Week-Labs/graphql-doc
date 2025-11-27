import { describe, it, expect } from 'vitest';
import { MdxRenderer } from './mdx-renderer';
import { Operation } from '../transformer/types';

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
    errors: [],
  };

  it('renders a basic operation', () => {
    const output = renderer.renderOperation(mockOperation);
    expect(output).toContain('# getUser');
    expect(output).toContain('Retrieves a user by ID.');
    expect(output).toContain('**Type:** `query`');
  });

  it('renders arguments table', () => {
    const output = renderer.renderOperation(mockOperation);
    expect(output).toContain('### Arguments');
    expect(output).toContain('| `id` | `ID` | The user ID |');
  });

  it('renders return type', () => {
    const output = renderer.renderOperation(mockOperation);
    expect(output).toContain('### Return Type');
    expect(output).toContain('`User`');
  });

  it('renders deprecation notice', () => {
    const deprecatedOp = {
      ...mockOperation,
      isDeprecated: true,
      deprecationReason: 'Use getUserById instead.',
    };
    const output = renderer.renderOperation(deprecatedOp);
    expect(output).toContain('> [!WARNING]');
    expect(output).toContain('**Deprecated**: Use getUserById instead.');
  });
});
