import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { Tabs } from './Tabs';

describe('Tabs', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders tabs and switches content', () => {
    const onChange = vi.fn();
    render(
      <Tabs
        tabs={[
          { id: 'one', label: 'One', content: <div>Panel One</div> },
          { id: 'two', label: 'Two', content: <div>Panel Two</div> },
        ]}
        onChange={onChange}
      />
    );

    expect(screen.getByText('Panel One')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'Two' }));
    expect(screen.getByText('Panel Two')).toBeInTheDocument();
    expect(onChange).toHaveBeenCalledWith('two');
  });

  it('supports keyboard navigation', () => {
    render(
      <Tabs
        tabs={[
          { id: 'one', label: 'One', content: <div>Panel One</div> },
          { id: 'two', label: 'Two', content: <div>Panel Two</div> },
        ]}
      />
    );

    const firstTab = screen.getByRole('tab', { name: 'One' });
    fireEvent.keyDown(firstTab, { key: 'ArrowRight' });
    expect(screen.getByText('Panel Two')).toBeInTheDocument();
  });

  it('clamps default index and filters hidden tabs', () => {
    render(
      <Tabs
        defaultIndex={5}
        tabs={[
          { id: 'hidden', label: 'Hidden', content: <div>Hidden</div>, hidden: true },
          { id: 'one', label: 'One', content: <div>Panel One</div> },
          { id: 'two', label: 'Two', content: <div>Panel Two</div> },
        ]}
      />
    );

    expect(screen.queryByRole('tab', { name: 'Hidden' })).toBeNull();
    expect(screen.getByText('Panel Two')).toBeInTheDocument();
  });

  it('skips disabled tabs during arrow navigation', () => {
    render(
      <Tabs
        tabs={[
          { id: 'one', label: 'One', content: <div>Panel One</div> },
          { id: 'two', label: 'Two', content: <div>Panel Two</div>, disabled: true },
          { id: 'three', label: 'Three', content: <div>Panel Three</div> },
        ]}
      />
    );

    const firstTab = screen.getByRole('tab', { name: 'One' });
    fireEvent.keyDown(firstTab, { key: 'ArrowRight' });
    expect(screen.getByText('Panel Three')).toBeInTheDocument();
  });

  it('resets active tab when visible tabs change', () => {
    const { rerender } = render(
      <Tabs
        defaultIndex={1}
        tabs={[
          { id: 'one', label: 'One', content: <div>Panel One</div> },
          { id: 'two', label: 'Two', content: <div>Panel Two</div> },
        ]}
      />
    );

    expect(screen.getByText('Panel Two')).toBeInTheDocument();

    rerender(
      <Tabs
        defaultIndex={1}
        tabs={[
          { id: 'one', label: 'One', content: <div>Panel One</div> },
          { id: 'two', label: 'Two', content: <div>Panel Two</div>, hidden: true },
        ]}
      />
    );

    expect(screen.getByText('Panel One')).toBeInTheDocument();
  });

  it('returns null when all tabs are hidden', () => {
    const { container } = render(
      <Tabs tabs={[{ id: 'one', label: 'One', content: <div>Panel One</div>, hidden: true }]} />
    );

    expect(container.firstChild).toBeNull();
  });
});
