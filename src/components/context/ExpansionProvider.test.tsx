import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';

import { ExpansionProvider, useExpansion } from './ExpansionProvider';
import React from 'react';

// Wrapper for testing context
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ExpansionProvider>{children}</ExpansionProvider>
);

describe('ExpansionProvider', () => {
  it('respects default levels in default mode', () => {
    const { result } = renderHook(() => useExpansion(), { wrapper });

    // Check Depth 0 (should be expanded if defaultLevels > 0)
    // Assuming defaultLevels=2
    expect(result.current.isExpanded('root', 0, 2)).toBe(true);
    expect(result.current.isExpanded('root.child', 1, 2)).toBe(true);
    expect(result.current.isExpanded('root.child.leaf', 2, 2)).toBe(false);
  });

  it('toggles expansion state explicitly', () => {
    const { result } = renderHook(() => useExpansion(), { wrapper });
    const path = 'root.child.leaf';

    // Initially closed (depth 2 >= default 2)
    expect(result.current.isExpanded(path, 2, 2)).toBe(false);

    // Toggle open
    act(() => {
      result.current.toggleExpand(path, false); // pass currentExpanded=false
    });

    expect(result.current.isExpanded(path, 2, 2)).toBe(true);

    // Toggle closed
    act(() => {
      result.current.toggleExpand(path, true); // pass currentExpanded=true
    });

    expect(result.current.isExpanded(path, 2, 2)).toBe(false);
  });

  it('overridges default open state', () => {
    const { result } = renderHook(() => useExpansion(), { wrapper });
    const path = 'root';

    // Initially open (depth 0 < default 2)
    expect(result.current.isExpanded(path, 0, 2)).toBe(true);

    // Toggle close
    act(() => {
      result.current.toggleExpand(path, true);
    });

    expect(result.current.isExpanded(path, 0, 2)).toBe(false);
  });

  it('handles expandAll mode', () => {
    const { result } = renderHook(() => useExpansion(), { wrapper });

    act(() => {
      result.current.expandAll();
    });

    // Everything should be open regardless of depth
    expect(result.current.mode).toBe('all');
    expect(result.current.isExpanded('very.deep.node', 10, 2)).toBe(true);
  });

  it('handles collapseAll mode', () => {
    const { result } = renderHook(() => useExpansion(), { wrapper });

    act(() => {
      result.current.collapseAll();
    });

    // Everything should be closed
    expect(result.current.mode).toBe('none');
    expect(result.current.isExpanded('root', 0, 2)).toBe(false);
  });

  it('respects overrides even after mode change behavior', () => {
    const { result } = renderHook(() => useExpansion(), { wrapper });

    // 1. Expand All
    act(() => {
      result.current.expandAll();
    });
    expect(result.current.isExpanded('node', 5, 2)).toBe(true);

    // 2. Collapse specific node (override for 'all' mode)
    act(() => {
      result.current.toggleExpand('node', true);
    });

    // Should be collapsed now
    expect(result.current.isExpanded('node', 5, 2)).toBe(false);
    // Siblings should still be open
    expect(result.current.isExpanded('sibling', 5, 2)).toBe(true);

    // 3. Clear overrides by Expand All again
    act(() => {
      result.current.expandAll();
    });
    expect(result.current.isExpanded('node', 5, 2)).toBe(true);
  });

  it('tracks sibling branches independently', () => {
    const { result } = renderHook(() => useExpansion(), { wrapper });

    // user (0) -> posts (1) -> likes (2)
    //                      -> comments (2)
    // Assume defaultLevels = 2

    const likesPath = 'user.posts.likes';
    const commentsPath = 'user.posts.comments';

    // Both closed by default (depth 2 >= 2)
    expect(result.current.isExpanded(likesPath, 2, 2)).toBe(false);
    expect(result.current.isExpanded(commentsPath, 2, 2)).toBe(false);

    // Expand 'likes' manually
    act(() => {
      // It is currently closed (false), so we pass false to toggle it OPEN
      result.current.toggleExpand(likesPath, false);
    });

    // Likes should be open (override set to true)
    expect(result.current.isExpanded(likesPath, 2, 2)).toBe(true);

    // Comments should STILL be closed (remains default)
    expect(result.current.isExpanded(commentsPath, 2, 2)).toBe(false);

    // Expand 'comments' manually
    act(() => {
      result.current.toggleExpand(commentsPath, false);
    });

    // NOW comments is open
    expect(result.current.isExpanded(commentsPath, 2, 2)).toBe(true);
  });
});
