// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { TypeViewer } from './TypeViewer';
import { ExpansionProvider } from '../context/ExpansionProvider';
import { ExpandedType } from '../../core/transformer/types';

const mockScalar: ExpandedType = {
  kind: 'SCALAR',
  name: 'String',
  description: 'A text string',
};

const mockEnum: ExpandedType = {
  kind: 'ENUM',
  name: 'Role',
  values: [
    { name: 'ADMIN', isDeprecated: false },
    { name: 'USER', isDeprecated: false },
  ],
};

const mockObject: ExpandedType = {
  kind: 'OBJECT',
  name: 'User',
  fields: [
    {
      name: 'id',
      type: { kind: 'SCALAR', name: 'ID' },
      isRequired: true,
      isList: false,
      isDeprecated: false,
    },
    {
      name: 'role',
      type: mockEnum,
      isRequired: false,
      isList: false,
      isDeprecated: false,
    },
  ],
};

const mockTypeRef: ExpandedType = {
  kind: 'TYPE_REF',
  name: 'User',
  link: '#user',
};

const mockCircularRef: ExpandedType = {
  kind: 'CIRCULAR_REF',
  ref: 'User',
  link: '#user',
};

const mockEmptyObject: ExpandedType = {
  kind: 'OBJECT',
  name: 'Empty',
  fields: [],
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ExpansionProvider>{children}</ExpansionProvider>
);

describe('TypeViewer', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders a SCALAR type correctly', () => {
    render(
      <TestWrapper>
        <TypeViewer type={mockScalar} />
      </TestWrapper>
    );
    expect(screen.getByText('String')).toBeDefined();
  });

  it('renders an OBJECT type with name', () => {
    render(
      <TestWrapper>
        <TypeViewer type={mockObject} />
      </TestWrapper>
    );
    expect(screen.getByText('User')).toBeDefined();
  });

  it('renders fields of an OBJECT', () => {
    render(
      <TestWrapper>
        <TypeViewer type={mockObject} />
      </TestWrapper>
    );

    expect(screen.getByText('id')).toBeDefined();
    expect(screen.getByText('role')).toBeDefined();
    expect(screen.getByText('ID')).toBeDefined();
    expect(screen.getByText('Role')).toBeDefined();
  });

  it('renders LIST types with brackets', () => {
    const listType: ExpandedType = {
      kind: 'LIST',
      ofType: mockScalar,
    };

    render(
      <TestWrapper>
        <TypeViewer type={listType} />
      </TestWrapper>
    );

    // Verify brackets are rendered with the type name
    const listNode = document.querySelector('.gql-type-list');
    expect(listNode?.textContent).toContain('String');
    expect(listNode?.textContent).toContain('[');
  });

  it('renders LIST of OBJECTS correctly', () => {
    const listType: ExpandedType = {
      kind: 'LIST',
      ofType: mockObject,
    };

    render(
      <TestWrapper>
        <TypeViewer type={listType} />
      </TestWrapper>
    );

    expect(screen.getByText('Array')).toBeDefined();
    expect(screen.getByText('User')).toBeDefined();
    expect(screen.getByText('id')).toBeDefined();
  });

  it('renders ENUM types with badge', () => {
    render(
      <TestWrapper>
        <TypeViewer type={mockEnum} />
      </TestWrapper>
    );

    expect(screen.getByText('Role')).toBeDefined();
    expect(screen.getByText('ENUM')).toBeDefined();
  });

  it('renders TYPE_REF and CIRCULAR_REF without links by default', () => {
    const { container } = render(
      <TestWrapper>
        <TypeViewer type={mockTypeRef} labelPrefix="(" labelSuffix=")" />
        <TypeViewer type={mockCircularRef} />
      </TestWrapper>
    );

    expect(container.textContent).toContain('(User)');
    expect(screen.queryAllByRole('link').length).toBe(0);
  });

  it('renders TYPE_REF and CIRCULAR_REF links when enabled', () => {
    const { container } = render(
      <TestWrapper>
        <TypeViewer type={mockTypeRef} typeLinkMode="all" labelPrefix="(" labelSuffix=")" />
        <TypeViewer type={mockCircularRef} typeLinkMode="all" />
      </TestWrapper>
    );

    expect(container.textContent).toContain('(User)');
    const links = screen.getAllByRole('link', { name: /User/ });
    expect(links.some((link) => link.classList.contains('gql-circular-ref'))).toBe(true);
  });

  it('renders UNION types with possible options', () => {
    const unionType: ExpandedType = {
      kind: 'UNION',
      name: 'SearchResult',
      possibleTypes: [mockScalar, mockTypeRef],
    };

    render(
      <TestWrapper>
        <TypeViewer type={unionType} />
      </TestWrapper>
    );

    expect(screen.getByText('UNION')).toBeDefined();
    expect(screen.getByText('SearchResult')).toBeDefined();
    expect(screen.getByText('String')).toBeDefined();
    expect(screen.getByText('User')).toBeDefined();
  });

  it('renders an empty object placeholder', () => {
    render(
      <TestWrapper>
        <TypeViewer type={mockEmptyObject} />
      </TestWrapper>
    );

    expect(screen.getByText('No fields')).toBeDefined();
  });

  it('renders a fallback for missing types', () => {
    render(
      <TestWrapper>
        <TypeViewer type={null as unknown as ExpandedType} />
      </TestWrapper>
    );

    expect(screen.getByText('Unknown Type')).toBeDefined();
  });
});
