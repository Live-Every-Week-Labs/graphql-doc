import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CodeExample } from './CodeExample';
import { mockExampleSuccess } from '../__tests__/fixtures';

describe('CodeExample', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders tabs for query, variables, and response', () => {
    render(<CodeExample example={mockExampleSuccess} />);
    expect(screen.getByRole('tab', { name: 'Query' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Variables' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Response' })).toBeInTheDocument();
  });

  it('copies query content', async () => {
    render(<CodeExample example={mockExampleSuccess} />);
    const copyButton = screen.getByRole('button', { name: /copy graphql/i });
    fireEvent.click(copyButton);
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });
});
