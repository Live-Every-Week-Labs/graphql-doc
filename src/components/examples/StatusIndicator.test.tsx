import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatusIndicator } from './StatusIndicator';

describe('StatusIndicator', () => {
  it('renders a success indicator', () => {
    render(<StatusIndicator type="success" />);
    expect(screen.getByLabelText('Success')).toHaveClass('gql-status-success');
  });

  it('renders a failure indicator', () => {
    render(<StatusIndicator type="failure" />);
    expect(screen.getByLabelText('Failure')).toHaveClass('gql-status-failure');
  });

  it('renders an error indicator', () => {
    render(<StatusIndicator type="error" />);
    expect(screen.getByLabelText('Error')).toHaveClass('gql-status-error');
  });
});
