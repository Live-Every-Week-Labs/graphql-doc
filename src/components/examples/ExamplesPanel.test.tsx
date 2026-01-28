import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ExamplesPanel } from './ExamplesPanel';
import { mockExampleSuccess, mockExampleError } from '../__tests__/fixtures';

describe('ExamplesPanel', () => {
  it('sorts success examples first', () => {
    render(
      <ExamplesPanel examples={[mockExampleError, mockExampleSuccess]} operationName="getUser" />
    );

    const tabs = screen.getAllByRole('tab');
    expect(tabs[0]).toHaveTextContent('GetUser');
  });

  it('shows empty state when no examples', () => {
    render(<ExamplesPanel examples={[]} operationName="getUser" />);
    expect(screen.getByText(/No examples available/i)).toBeInTheDocument();
  });
});
