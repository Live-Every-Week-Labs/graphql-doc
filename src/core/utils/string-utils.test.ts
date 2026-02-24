import { describe, it, expect } from 'vitest';
import { operationKey, slugify } from './string-utils.js';

describe('slugify', () => {
  describe('camelCase handling', () => {
    it('should convert camelCase to kebab-case', () => {
      expect(slugify('getUser')).toBe('get-user');
    });

    it('should handle multiple camelCase transitions', () => {
      expect(slugify('getUserById')).toBe('get-user-by-id');
    });

    it('should handle consecutive uppercase letters', () => {
      // Regex only matches lowercase followed by uppercase, so HTTP stays together
      expect(slugify('getHTTPResponse')).toBe('get-httpresponse');
    });
  });

  describe('basic transformations', () => {
    it('should convert to lowercase', () => {
      expect(slugify('USERS')).toBe('users');
    });

    it('should convert spaces to hyphens', () => {
      expect(slugify('User Management')).toBe('user-management');
    });

    it('should handle mixed case with spaces', () => {
      expect(slugify('Get User By Id')).toBe('get-user-by-id');
    });
  });

  describe('special character handling', () => {
    it('should remove special characters', () => {
      expect(slugify('get"User#1')).toBe('get-user-1');
    });

    it('should handle colons and other punctuation', () => {
      expect(slugify('User: GetDetails')).toBe('user-get-details');
    });

    it('should handle multiple consecutive special characters', () => {
      expect(slugify('foo---bar___baz')).toBe('foo-bar-baz');
    });
  });

  describe('edge cases', () => {
    it('should return empty string for empty input', () => {
      expect(slugify('')).toBe('');
    });

    it('should return empty string for null/undefined', () => {
      // @ts-expect-error Testing null input
      expect(slugify(null)).toBe('');
      // @ts-expect-error Testing undefined input
      expect(slugify(undefined)).toBe('');
    });

    it('should remove leading hyphens', () => {
      expect(slugify('-leadingHyphen')).toBe('leading-hyphen');
    });

    it('should remove trailing hyphens', () => {
      expect(slugify('trailingHyphen-')).toBe('trailing-hyphen');
    });

    it('should handle string with only special characters', () => {
      expect(slugify('---')).toBe('');
    });

    it('should handle numbers', () => {
      expect(slugify('user123')).toBe('user123');
    });

    it('should handle numbers with camelCase', () => {
      // Regex only matches lowercase followed by uppercase, 3 is not lowercase
      expect(slugify('getUser123ById')).toBe('get-user123by-id');
    });
  });
});

describe('operationKey', () => {
  it('builds a composite key from operation type and name', () => {
    expect(operationKey({ operationType: 'query', operationName: 'getUser' })).toBe(
      'query:getUser'
    );
  });

  it('differentiates operations with the same name across types', () => {
    expect(operationKey({ operationType: 'query', operationName: 'ping' })).not.toBe(
      operationKey({ operationType: 'mutation', operationName: 'ping' })
    );
  });
});
