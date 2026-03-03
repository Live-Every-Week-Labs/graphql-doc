import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { TypeDefinitionView } from './TypeDefinitionView';
import { mockReturnType } from '../__tests__/fixtures';

describe('TypeDefinitionView', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders type heading and fields section', () => {
    render(<TypeDefinitionView type={mockReturnType} />);
    expect(screen.getByRole('heading', { name: 'User' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Fields' })).toBeInTheDocument();
  });

  it('adds Docusaurus layout bridge classes for full-width rendering', () => {
    const hostContainer = document.createElement('div');
    hostContainer.className = 'container';
    const docItemCol = document.createElement('div');
    docItemCol.className = 'col docItemCol_abc';
    const mountPoint = document.createElement('div');

    docItemCol.appendChild(mountPoint);
    hostContainer.appendChild(docItemCol);
    document.body.appendChild(hostContainer);

    const { unmount } = render(<TypeDefinitionView type={mockReturnType} />, {
      container: mountPoint,
    });

    expect(document.body).toHaveClass('gql-docs-page');
    expect(hostContainer).toHaveClass('gql-docs-container');
    expect(docItemCol).toHaveClass('gql-docs-col');
    expect(hostContainer.style.getPropertyValue('max-width')).toBe('1800px');
    expect(docItemCol.style.getPropertyValue('max-width')).toBe('100%');
    expect(docItemCol.style.getPropertyValue('--ifm-col-width')).toBe('100%');

    unmount();

    expect(document.body).not.toHaveClass('gql-docs-page');
    expect(hostContainer).not.toHaveClass('gql-docs-container');
    expect(docItemCol).not.toHaveClass('gql-docs-col');
    expect(hostContainer.style.getPropertyValue('max-width')).toBe('');
    expect(docItemCol.style.getPropertyValue('max-width')).toBe('');
    expect(docItemCol.style.getPropertyValue('--ifm-col-width')).toBe('');
    hostContainer.remove();
  });
});
