import type { GroupOrderingConfig } from '../config/schema.js';
import { DEFAULT_GROUP_NAME } from '../utils/index.js';
import type { Section } from './types.js';

/**
 * Normalize group names for matching configured ordering entries against section names.
 *
 * Rules intentionally match config documentation:
 * - case-insensitive (`toLowerCase`)
 * - trim surrounding whitespace
 * - replace internal whitespace with underscores
 */
function normalizeGroupOrderingKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '_');
}

/**
 * Keep first occurrence by normalized key so duplicate config entries do not reorder later entries.
 */
function uniqueNormalizedEntries(entries: string[]): string[] {
  const unique: string[] = [];
  const seen = new Set<string>();

  for (const entry of entries) {
    const key = normalizeGroupOrderingKey(entry);
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(key);
  }

  return unique;
}

function alphabeticalSort(a: Section, b: Section): number {
  return a.name.localeCompare(b.name);
}

function withUncategorizedLast(sections: Section[], uncategorizedName: string): Section[] {
  const uncategorized: Section[] = [];
  const nonUncategorized: Section[] = [];

  for (const section of sections) {
    if (section.name === uncategorizedName) {
      uncategorized.push(section);
    } else {
      nonUncategorized.push(section);
    }
  }

  return [...nonUncategorized, ...uncategorized];
}

function sortExplicit(sections: Section[], explicitOrder: string[]): Section[] {
  const explicitKeys = uniqueNormalizedEntries(explicitOrder);
  const explicitIndex = new Map(explicitKeys.map((key, index) => [key, index]));

  return sections.sort((a, b) => {
    const aIndex = explicitIndex.get(normalizeGroupOrderingKey(a.name));
    const bIndex = explicitIndex.get(normalizeGroupOrderingKey(b.name));

    if (aIndex !== undefined && bIndex !== undefined) {
      return aIndex - bIndex || alphabeticalSort(a, b);
    }
    if (aIndex !== undefined) return -1;
    if (bIndex !== undefined) return 1;
    return alphabeticalSort(a, b);
  });
}

function sortPinned(sections: Section[], pinToStart: string[], pinToEnd: string[]): Section[] {
  const startKeys = uniqueNormalizedEntries(pinToStart);
  const endKeys = uniqueNormalizedEntries(pinToEnd);
  const startIndex = new Map(startKeys.map((key, index) => [key, index]));
  const endIndex = new Map(endKeys.map((key, index) => [key, index]));

  const bucket = (section: Section): 0 | 1 | 2 => {
    const key = normalizeGroupOrderingKey(section.name);
    if (startIndex.has(key)) return 0;
    if (endIndex.has(key)) return 2;
    return 1;
  };

  return sections.sort((a, b) => {
    const aBucket = bucket(a);
    const bBucket = bucket(b);
    if (aBucket !== bBucket) {
      return aBucket - bBucket;
    }

    const aKey = normalizeGroupOrderingKey(a.name);
    const bKey = normalizeGroupOrderingKey(b.name);

    if (aBucket === 0) {
      return (startIndex.get(aKey) ?? 0) - (startIndex.get(bKey) ?? 0) || alphabeticalSort(a, b);
    }
    if (aBucket === 2) {
      return (endIndex.get(aKey) ?? 0) - (endIndex.get(bKey) ?? 0) || alphabeticalSort(a, b);
    }

    return alphabeticalSort(a, b);
  });
}

/**
 * Sort top-level sections according to config policy while preserving the product rule that
 * `Uncategorized` remains terminal.
 */
export function sortSectionsByGroupOrdering(
  sections: Section[],
  groupOrdering: GroupOrderingConfig,
  uncategorizedName: string = DEFAULT_GROUP_NAME
): Section[] {
  const sortedInput = [...sections];
  let sorted: Section[];

  switch (groupOrdering.mode) {
    case 'explicit':
      sorted = sortExplicit(sortedInput, groupOrdering.explicitOrder);
      break;
    case 'pinned':
      sorted = sortPinned(sortedInput, groupOrdering.pinToStart, groupOrdering.pinToEnd);
      break;
    case 'alphabetical':
    default:
      sorted = sortedInput.sort(alphabeticalSort);
      break;
  }

  return withUncategorizedLast(sorted, uncategorizedName);
}
