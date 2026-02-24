/**
 * YAML escaping utilities for safe front matter generation.
 *
 * These functions ensure that user-provided values don't break YAML syntax
 * or inject unexpected properties into front matter.
 */

/**
 * Characters that require a YAML value to be quoted.
 * Includes: newlines, tabs, colons, quotes, brackets, special YAML indicators.
 */
const YAML_SPECIAL_CHARS = /[\n\r\t:"'[\]{}#&*!|>%@`\\]/;

/**
 * Values that start with these patterns need quoting.
 */
const YAML_START_PATTERNS = /^[-? ]/;

/**
 * Values that end with these patterns need quoting.
 */
const YAML_END_PATTERNS = /[ ]$/;

/**
 * Escapes a string value for use in YAML front matter.
 *
 * - Returns simple alphanumeric values unquoted
 * - Wraps values containing special characters in double quotes
 * - Escapes internal double quotes using backslash escaping
 *
 * @param value - The string value to escape
 * @returns The escaped value, quoted if necessary
 *
 * @example
 * escapeYamlValue('SimpleValue')           // 'SimpleValue'
 * escapeYamlValue('Value with: colon')     // '"Value with: colon"'
 * escapeYamlValue('Value with "quotes"')   // '"Value with ""quotes"""'
 * escapeYamlValue('Multi\nline')           // '"Multi\nline"'
 */
export function escapeYamlValue(value: string): string {
  // Empty strings need quoting
  if (value === '') {
    return '""';
  }

  // Check if value needs quoting
  const needsQuoting =
    YAML_SPECIAL_CHARS.test(value) ||
    YAML_START_PATTERNS.test(value) ||
    YAML_END_PATTERNS.test(value);

  if (!needsQuoting) {
    return value;
  }

  // Escape backslashes first, then double quotes, then wrap in quotes
  // Use YAML double-quoted string escaping
  const escaped = value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');

  return `"${escaped}"`;
}

/**
 * Escapes a tag value for use in a YAML array within front matter.
 *
 * Tags are always quoted since they appear in array context and
 * could contain any user-provided content.
 *
 * @param tag - The tag value to escape
 * @returns The escaped tag, always double-quoted
 *
 * @example
 * escapeYamlTag('api')                    // '"api"'
 * escapeYamlTag('user-management')        // '"user-management"'
 * escapeYamlTag('tag with "quotes"')      // '"tag with \"quotes\""'
 */
export function escapeYamlTag(tag: string): string {
  // Tags are always quoted for safety in array context
  // Escape backslashes first, then double quotes
  const escaped = tag.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `"${escaped}"`;
}
