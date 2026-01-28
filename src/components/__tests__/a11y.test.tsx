import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { axe } from 'vitest-axe';
import { toHaveNoViolations } from 'vitest-axe/matchers';
import { OperationView } from '../content/OperationView';
import { ExamplesPanel } from '../examples/ExamplesPanel';
import { mockOperation, mockExampleSuccess } from './fixtures';

expect.extend({ toHaveNoViolations });

describe('Accessibility', () => {
  it('OperationView has no obvious a11y violations', async () => {
    const { container } = render(<OperationView operation={mockOperation} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('ExamplesPanel has no obvious a11y violations', async () => {
    const { container } = render(
      <ExamplesPanel examples={[mockExampleSuccess]} operationName="getUser" />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
