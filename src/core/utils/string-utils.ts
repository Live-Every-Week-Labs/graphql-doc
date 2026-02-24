/**
 * String utility functions for URL-friendly transformations and text extraction.
 */

/**
 * Extract the first sentence (ending with `.`, `!`, or `?`) from a string.
 * Returns the trimmed input if no sentence-ending punctuation is found.
 * Returns empty string for falsy/empty input.
 */
export function firstSentence(value?: string): string {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  const match = trimmed.match(/^[\s\S]*?[.!?](\s|$)/);
  return (match ? match[0] : trimmed).trim();
}

export interface OperationKeyInput {
  operationType: string;
  operationName: string;
}

/**
 * Build a stable lookup key for GraphQL operations.
 *
 * Operation names are only unique within a root type, so we key by
 * `operationType:name` to avoid collisions between query/mutation/subscription.
 */
export function operationKey({ operationType, operationName }: OperationKeyInput): string {
  return `${operationType}:${operationName}`;
}

/**
 * Converts text to a URL-friendly slug.
 *
 * - Handles camelCase by inserting hyphens (getUser -> get-user)
 * - Converts to lowercase
 * - Replaces non-alphanumeric characters with hyphens
 * - Removes leading/trailing hyphens
 *
 * @param text - The text to slugify
 * @returns A URL-friendly slug
 *
 * @example
 * slugify('getUser')           // 'get-user'
 * slugify('getUserById')       // 'get-user-by-id'
 * slugify('User Management')   // 'user-management'
 * slugify('get"User#1')        // 'get-user-1'
 */
export function slugify(text: string): string {
  if (!text) return '';
  return text
    .replace(/([a-z])([A-Z])/g, '$1-$2') // Insert hyphen between camelCase
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}
