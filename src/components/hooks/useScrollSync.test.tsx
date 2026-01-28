import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useScrollSync } from './useScrollSync';

const ScrollSyncTester = ({ onVisible }: { onVisible: (name: string) => void }) => {
  useScrollSync(onVisible);
  return (
    <div>
      <section data-operation="getUser">Operation</section>
    </div>
  );
};

describe('useScrollSync', () => {
  it('notifies when an operation becomes visible', () => {
    const onVisible = vi.fn();
    render(<ScrollSyncTester onVisible={onVisible} />);
    expect(onVisible).toHaveBeenCalledWith('getUser');
  });
});
