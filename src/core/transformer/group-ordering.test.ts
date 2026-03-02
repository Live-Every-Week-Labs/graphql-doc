import { describe, expect, it } from 'vitest';
import type { Section } from './types';
import { sortSectionsByGroupOrdering } from './group-ordering';

function makeSections(names: string[]): Section[] {
  return names.map((name) => ({
    name,
    order: 0,
    subsections: [],
  }));
}

describe('sortSectionsByGroupOrdering', () => {
  it('sorts alphabetically and keeps Uncategorized at the end', () => {
    const sections = makeSections(['Users', 'Alpha', 'Uncategorized', 'Payments']);

    const result = sortSectionsByGroupOrdering(sections, { mode: 'alphabetical' });
    expect(result.map((section) => section.name)).toEqual([
      'Alpha',
      'Payments',
      'Users',
      'Uncategorized',
    ]);
  });

  it('sorts explicit groups first, then remaining groups alphabetically', () => {
    const sections = makeSections(['Users', 'Alpha', 'Payments', 'System', 'Uncategorized']);

    const result = sortSectionsByGroupOrdering(sections, {
      mode: 'explicit',
      explicitOrder: ['Payments', 'System'],
    });

    expect(result.map((section) => section.name)).toEqual([
      'Payments',
      'System',
      'Alpha',
      'Users',
      'Uncategorized',
    ]);
  });

  it('matches explicit ordering entries with normalized keys', () => {
    const sections = makeSections(['Deprecated Payments', 'Users', 'Uncategorized']);

    const result = sortSectionsByGroupOrdering(sections, {
      mode: 'explicit',
      explicitOrder: ['  DEPRECATED_payments '],
    });

    expect(result.map((section) => section.name)).toEqual([
      'Deprecated Payments',
      'Users',
      'Uncategorized',
    ]);
  });

  it('sorts pinned groups with start/middle/end buckets', () => {
    const sections = makeSections([
      'Payments',
      'Deprecated',
      'Users',
      'Authentication',
      'Uncategorized',
    ]);

    const result = sortSectionsByGroupOrdering(sections, {
      mode: 'pinned',
      pinToStart: ['Authentication'],
      pinToEnd: ['Deprecated'],
    });

    expect(result.map((section) => section.name)).toEqual([
      'Authentication',
      'Payments',
      'Users',
      'Deprecated',
      'Uncategorized',
    ]);
  });

  it('treats omitted pinned lists as empty for programmatic callers', () => {
    const sections = makeSections(['Users', 'Deprecated', 'Authorization', 'Uncategorized']);

    const result = sortSectionsByGroupOrdering(sections, {
      mode: 'pinned',
      pinToEnd: ['Deprecated'],
    } as any);

    expect(result.map((section) => section.name)).toEqual([
      'Authorization',
      'Users',
      'Deprecated',
      'Uncategorized',
    ]);
  });

  it('uses first occurrence for duplicate explicit entries and ignores unknown groups', () => {
    const sections = makeSections(['Users', 'Payments', 'Alpha', 'Uncategorized']);

    const result = sortSectionsByGroupOrdering(sections, {
      mode: 'explicit',
      explicitOrder: ['Payments', 'payments', 'Missing', 'Users'],
    });

    expect(result.map((section) => section.name)).toEqual([
      'Payments',
      'Users',
      'Alpha',
      'Uncategorized',
    ]);
  });
});
