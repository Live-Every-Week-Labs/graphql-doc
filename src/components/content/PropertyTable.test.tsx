// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { FieldTable } from './FieldTable';
import { ArgumentsTable } from './ArgumentsTable';
import { ExpandedField, ExpandedArgument } from '../../core/transformer/types';
import { ExpansionProvider } from '../context/ExpansionProvider';

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ExpansionProvider>{children}</ExpansionProvider>
);

describe('FieldTable', () => {
  afterEach(() => {
    cleanup();
  });

  const mockScalarType = { kind: 'SCALAR' as const, name: 'String' };

  it('renders nothing when no properties are provided', () => {
    const { container } = render(
      <TestWrapper>
        <FieldTable fields={[]} />
      </TestWrapper>
    );
    expect(container.firstChild).toBeNull();
  });

  describe('Fields', () => {
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
        name: 'deprecatedField',
        type: mockScalarType,
        isRequired: false,
        isList: false,
        isDeprecated: true,
        deprecationReason: 'Do not use',
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

    it('renders fields correctly', () => {
      render(
        <TestWrapper>
          <FieldTable fields={mockFields} />
        </TestWrapper>
      );
      expect(screen.getByText('id')).toBeDefined();
      expect(screen.getByText('Unique identifier')).toBeDefined();
    });

    it('displays required indicator', () => {
      render(
        <TestWrapper>
          <FieldTable fields={mockFields} />
        </TestWrapper>
      );
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
      expect(screen.getByText('deprecatedField').classList.contains('gql-deprecated-name')).toBe(
        true
      );
    });

    it('renders field arguments', () => {
      render(
        <TestWrapper>
          <FieldTable fields={mockFields} />
        </TestWrapper>
      );
      expect(screen.getByText('Arguments:')).toBeDefined();
      expect(screen.getByText('limit')).toBeDefined();
    });
  });

  describe('ArgumentsTable', () => {
    const mockArgs: ExpandedArgument[] = [
      {
        name: 'arg1',
        type: mockScalarType,
        isRequired: false,
        defaultValue: 'defaultVal',
      },
      {
        name: 'arg2',
        type: mockScalarType,
        isRequired: true,
      },
    ];

    it('renders arguments correctly', () => {
      render(
        <TestWrapper>
          <ArgumentsTable arguments={mockArgs} />
        </TestWrapper>
      );
      expect(screen.getByText('arg1')).toBeDefined();
    });

    it('displays default values', () => {
      render(
        <TestWrapper>
          <ArgumentsTable arguments={mockArgs} />
        </TestWrapper>
      );
      expect(screen.getByText('Default')).toBeDefined();
      expect(screen.getByText('"defaultVal"')).toBeDefined();
    });
  });
});
