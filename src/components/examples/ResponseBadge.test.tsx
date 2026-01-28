import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ResponseBadge } from './ResponseBadge';

describe('ResponseBadge', () => {
  it('shows status and HTTP code', () => {
    render(<ResponseBadge type="success" httpStatus={200} />);
    expect(screen.getByText('SUCCESS 200')).toBeInTheDocument();
  });

  it('renders failure without an HTTP status', () => {
    render(<ResponseBadge type="failure" />);
    expect(screen.getByText('FAILURE')).toBeInTheDocument();
  });

  it('renders error with an HTTP status', () => {
    render(<ResponseBadge type="error" httpStatus={500} />);
    expect(screen.getByText('ERROR 500')).toBeInTheDocument();
  });
});
