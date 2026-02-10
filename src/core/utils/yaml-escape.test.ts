import { describe, it, expect } from 'vitest';
import { escapeYamlValue, escapeYamlTag } from './yaml-escape.js';

describe('escapeYamlValue', () => {
  describe('simple values (no escaping needed)', () => {
    it('should return simple alphanumeric values unquoted', () => {
      expect(escapeYamlValue('SimpleValue')).toBe('SimpleValue');
    });

    it('should return camelCase values unquoted', () => {
      expect(escapeYamlValue('getUserById')).toBe('getUserById');
    });

    it('should return PascalCase values unquoted', () => {
      expect(escapeYamlValue('GetUserById')).toBe('GetUserById');
    });

    it('should return values with numbers unquoted', () => {
      expect(escapeYamlValue('user123')).toBe('user123');
    });
  });

  describe('values requiring escaping', () => {
    it('should quote empty strings', () => {
      expect(escapeYamlValue('')).toBe('""');
    });

    it('should quote and escape values with double quotes', () => {
      expect(escapeYamlValue('Value with "quotes"')).toBe('"Value with \\"quotes\\""');
    });

    it('should quote and escape values with newlines', () => {
      expect(escapeYamlValue('Line1\nLine2')).toBe('"Line1\\nLine2"');
    });

    it('should quote and escape values with carriage returns', () => {
      expect(escapeYamlValue('Line1\rLine2')).toBe('"Line1\\rLine2"');
    });

    it('should quote values with colons', () => {
      expect(escapeYamlValue('Key: Value')).toBe('"Key: Value"');
    });

    it('should quote values with single quotes', () => {
      expect(escapeYamlValue("Value with 'quotes'")).toBe('"Value with \'quotes\'"');
    });

    it('should quote values with square brackets', () => {
      expect(escapeYamlValue('array[0]')).toBe('"array[0]"');
    });

    it('should quote values with curly braces', () => {
      expect(escapeYamlValue('object{key}')).toBe('"object{key}"');
    });

    it('should quote values with hash/comment character', () => {
      expect(escapeYamlValue('value #comment')).toBe('"value #comment"');
    });

    it('should quote values with ampersand', () => {
      expect(escapeYamlValue('value&anchor')).toBe('"value&anchor"');
    });

    it('should quote values with asterisk', () => {
      expect(escapeYamlValue('value*alias')).toBe('"value*alias"');
    });

    it('should quote values with exclamation mark', () => {
      expect(escapeYamlValue('!important')).toBe('"!important"');
    });

    it('should quote values with pipe character', () => {
      expect(escapeYamlValue('value|literal')).toBe('"value|literal"');
    });

    it('should quote values with greater-than', () => {
      expect(escapeYamlValue('value>folded')).toBe('"value>folded"');
    });

    it('should quote values with percent sign', () => {
      expect(escapeYamlValue('100%')).toBe('"100%"');
    });

    it('should quote values with at sign', () => {
      expect(escapeYamlValue('user@domain')).toBe('"user@domain"');
    });

    it('should quote values with backtick', () => {
      expect(escapeYamlValue('code`block')).toBe('"code`block"');
    });

    it('should quote values starting with hyphen', () => {
      expect(escapeYamlValue('-value')).toBe('"-value"');
    });

    it('should quote values starting with question mark', () => {
      expect(escapeYamlValue('?value')).toBe('"?value"');
    });

    it('should quote values starting with space', () => {
      expect(escapeYamlValue(' leadingSpace')).toBe('" leadingSpace"');
    });

    it('should quote values ending with space', () => {
      expect(escapeYamlValue('trailingSpace ')).toBe('"trailingSpace "');
    });

    it('should handle and escape backslashes', () => {
      expect(escapeYamlValue('path\\to\\file')).toBe('"path\\\\to\\\\file"');
    });

    it('should handle tabs', () => {
      expect(escapeYamlValue('value\twith\ttabs')).toBe('"value\\twith\\ttabs"');
    });
  });

  describe('combined special characters', () => {
    it('should handle multiple special characters together', () => {
      expect(escapeYamlValue('User: "Admin"\nRole: Manager')).toBe(
        '"User: \\"Admin\\"\\nRole: Manager"'
      );
    });

    it('should handle quotes with backslashes', () => {
      expect(escapeYamlValue('path\\to\\"file"')).toBe('"path\\\\to\\\\\\"file\\""');
    });
  });

  describe('security edge cases', () => {
    it('should escape YAML injection attempt with key injection', () => {
      const malicious = 'value\ninjected_key: injected_value';
      const result = escapeYamlValue(malicious);
      expect(result).toBe('"value\\ninjected_key: injected_value"');
      // The result should not contain an unescaped newline
      expect(result).not.toMatch(/[^\\]\n/);
    });

    it('should escape YAML injection with document separator', () => {
      const malicious = 'value\n---\nnew_doc: true';
      const result = escapeYamlValue(malicious);
      expect(result).toBe('"value\\n---\\nnew_doc: true"');
    });
  });
});

describe('escapeYamlTag', () => {
  it('should always quote simple tags', () => {
    expect(escapeYamlTag('api')).toBe('"api"');
  });

  it('should always quote tags with hyphens', () => {
    expect(escapeYamlTag('user-management')).toBe('"user-management"');
  });

  it('should escape double quotes in tags', () => {
    expect(escapeYamlTag('tag with "quotes"')).toBe('"tag with \\"quotes\\""');
  });

  it('should escape backslashes in tags', () => {
    expect(escapeYamlTag('tag\\with\\backslashes')).toBe('"tag\\\\with\\\\backslashes"');
  });

  it('should handle tags with colons', () => {
    expect(escapeYamlTag('scope:subtag')).toBe('"scope:subtag"');
  });

  it('should handle tags with special characters', () => {
    expect(escapeYamlTag('tag#1')).toBe('"tag#1"');
  });

  it('should handle empty tags', () => {
    expect(escapeYamlTag('')).toBe('""');
  });

  it('should handle tags with newlines (malicious input)', () => {
    const malicious = 'tag"], "injected": "value';
    const result = escapeYamlTag(malicious);
    expect(result).toBe('"tag\\"], \\"injected\\": \\"value"');
  });
});
