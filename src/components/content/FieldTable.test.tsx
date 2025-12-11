// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { FieldTable } from './FieldTable';
import { ExpansionProvider } from '../context/ExpansionProvider';
import { ExpandedField } from '../../core/transformer/types';

// Mock data
const mockScalarType = { kind: 'SCALAR' as const, name: 'String' };

const mockFields: ExpandedField[] = [
  {
    name: 'id',
    type: { kind: 'SCALAR' as const, name: 'ID' },
    description: 'Unique identifier',
    isRequired: true,
    isList: false,
    isDeprecated: false,
  },
  {
    name: 'title',
    type: mockScalarType,
    description: 'Post title',
    isRequired: false,
    isList: false,
    isDeprecated: false,
  },
  {
    name: 'oldField',
    type: mockScalarType,
    isRequired: false,
    isList: false,
    isDeprecated: true,
    deprecationReason: 'Use newField instead',
  },
  {
    name: 'fieldWithArgs',
    type: mockScalarType,
    isRequired: false,
    isList: false,
    isDeprecated: false,
    args: [
      {
        name: 'limit',
        type: { kind: 'SCALAR' as const, name: 'Int' },
        description: 'Limit results',
      },
    ],
  },
];

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ExpansionProvider>{children}</ExpansionProvider>
);

describe('FieldTable', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders nothing if fields array is empty', () => {
    const { container } = render(
      <TestWrapper>
        <FieldTable fields={[]} />
      </TestWrapper>
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders list of fields correctly', () => {
    render(
      <TestWrapper>
        <FieldTable fields={mockFields} />
      </TestWrapper>
    );

    expect(screen.getByText('id')).toBeDefined();
    expect(screen.getByText('title')).toBeDefined();
    expect(screen.getByText('oldField')).toBeDefined();
  });

  it('displays required indicator', () => {
    render(
      <TestWrapper>
        <FieldTable fields={mockFields} />
      </TestWrapper>
    );
    // Find the row for 'id' which is required
    // We can look for the asterisk near it, or just verify asterisk is in document
    const requiredMarks = screen.getAllByTitle('Required');
    expect(requiredMarks.length).toBeGreaterThan(0);
    expect(requiredMarks[0].textContent).toBe('*');
  });

  it('displays deprecated status and reason', () => {
    render(
      <TestWrapper>
        <FieldTable fields={mockFields} />
      </TestWrapper>
    );

    expect(screen.getByText('Deprecated')).toBeDefined();
    const deprecatedBadge = screen.getByTitle('Use newField instead');
    expect(deprecatedBadge).toBeDefined();

    // Check strikethrough class on name
    const oldField = screen.getByText('oldField');
    expect(oldField.classList.contains('gql-deprecated-name')).toBe(true);
  });

  it('renders field descriptions', () => {
    render(
      <TestWrapper>
        <FieldTable fields={mockFields} />
      </TestWrapper>
    );
    expect(screen.getByText('Unique identifier')).toBeDefined();
    expect(screen.getByText('Post title')).toBeDefined();
  });

  it('renders field arguments', () => {
    render(
      <TestWrapper>
        <FieldTable fields={mockFields} />
      </TestWrapper>
    );

    expect(screen.getByText('Arguments:')).toBeDefined();
    expect(screen.getByText('limit')).toBeDefined();
    // Check arg type rendering
    expect(screen.getByText('Int')).toBeDefined();
  });
});
