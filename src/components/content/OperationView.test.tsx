import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { OperationView } from './OperationView';
import { mockOperation } from '../__tests__/fixtures';

describe('OperationView', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders heading with slug id and data-operation attribute', () => {
    const { container } = render(<OperationView operation={mockOperation} />);
    const section = container.querySelector('[data-operation="getUser"]');
    expect(section).toBeInTheDocument();
    const heading = container.querySelector('#get-user');
    expect(heading).toBeInTheDocument();
  });

  it('renders arguments and response sections', () => {
    render(<OperationView operation={mockOperation} />);
    expect(screen.getByRole('heading', { name: 'Arguments' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Response' })).toBeInTheDocument();
  });

  it('renders inline examples', () => {
    render(<OperationView operation={mockOperation} />);
    expect(screen.getAllByText('Examples').length).toBeGreaterThan(0);
  });

  it('renders a markdown download dropdown with overview and operation links', () => {
    render(<OperationView operation={mockOperation} llmDocsBasePath="/llm-docs" />);

    const button = screen.getByRole('button', { name: 'Download Markdown for General' });
    fireEvent.click(button);

    const groupOverviewLink = screen.getByRole('menuitem', { name: 'Download General Group' });
    const operationDetailsLink = screen.getByRole('menuitem', { name: 'Download getUser query' });

    expect(groupOverviewLink).toHaveAttribute('href', '/llm-docs/general.md');
    expect(operationDetailsLink).toHaveAttribute('href', '/llm-docs/general/get-user.md');
    expect(button.querySelector('svg')).toBeInTheDocument();
  });

  it('closes markdown download dropdown on Escape', () => {
    render(<OperationView operation={mockOperation} llmDocsBasePath="/llm-docs" />);

    const button = screen.getByRole('button', { name: 'Download Markdown for General' });
    fireEvent.click(button);
    expect(screen.getByRole('menuitem', { name: 'Download General Group' })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menuitem', { name: 'Download General Group' })).toBeNull();
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes markdown download dropdown on click-outside', () => {
    render(<OperationView operation={mockOperation} llmDocsBasePath="/llm-docs" />);

    const button = screen.getByRole('button', { name: 'Download Markdown for General' });
    fireEvent.click(button);
    expect(screen.getByRole('menuitem', { name: 'Download General Group' })).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('menuitem', { name: 'Download General Group' })).toBeNull();
  });

  it('sets markdown dropdown aria attributes', () => {
    render(<OperationView operation={mockOperation} llmDocsBasePath="/llm-docs" />);

    const button = screen.getByRole('button', { name: 'Download Markdown for General' });
    expect(button).toHaveAttribute('aria-haspopup', 'true');
    expect(button).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(button).toHaveAttribute('aria-controls');
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

    const { unmount } = render(<OperationView operation={mockOperation} />, {
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
