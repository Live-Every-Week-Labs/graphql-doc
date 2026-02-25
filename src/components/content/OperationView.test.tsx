import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
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

  it('renders an icon-only markdown download link when llmDocsBasePath is provided', () => {
    render(<OperationView operation={mockOperation} llmDocsBasePath="/llm-docs" />);

    const link = screen.getByRole('link', { name: 'Download Markdown for General' });
    expect(link).toHaveAttribute('href', '/llm-docs/general.md');
    expect(link.querySelector('svg')).toBeInTheDocument();
  });
});
