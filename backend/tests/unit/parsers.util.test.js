import { parsePositiveInt, parseBoolean, parseNumericSafe, parseHeaderTotal } from '../../src/utils/parsers.js';

describe('Parsers Utils', () => {
  describe('parsePositiveInt', () => {
    test('should parse valid positive integers', () => {
      expect(parsePositiveInt('123', 10)).toBe(123);
      expect(parsePositiveInt(456, 10)).toBe(456);
    });

    test('should return fallback for invalid values', () => {
      expect(parsePositiveInt('abc', 10)).toBe(10);
      expect(parsePositiveInt('-5', 10)).toBe(10);
      expect(parsePositiveInt('0', 10)).toBe(10);
      expect(parsePositiveInt(null, 10)).toBe(10);
    });

    test('should handle string numbers with spaces', () => {
      expect(parsePositiveInt('  42  ', 10)).toBe(42);
    });
  });

  describe('parseBoolean', () => {
    test('should parse true values', () => {
      expect(parseBoolean('true')).toBe(true);
      expect(parseBoolean('1')).toBe(true);
      expect(parseBoolean('yes')).toBe(true);
      expect(parseBoolean('on')).toBe(true);
    });

    test('should parse false values', () => {
      expect(parseBoolean('false')).toBe(false);
      expect(parseBoolean('0')).toBe(false);
      expect(parseBoolean('no')).toBe(false);
      expect(parseBoolean('off')).toBe(false);
    });

    test('should handle case insensitivity', () => {
      expect(parseBoolean('TRUE')).toBe(true);
      expect(parseBoolean('FALSE')).toBe(false);
    });

    test('should return fallback for invalid values', () => {
      expect(parseBoolean('invalid', false)).toBe(false);
      expect(parseBoolean('invalid', true)).toBe(true);
    });
  });

  describe('parseNumericSafe', () => {
    test('should parse valid numbers', () => {
      expect(parseNumericSafe('123')).toBe(123);
      expect(parseNumericSafe('45.67')).toBe(45.67);
      expect(parseNumericSafe(-100)).toBe(-100);
    });

    test('should return 0 for invalid values', () => {
      expect(parseNumericSafe('abc')).toBe(0);
      expect(parseNumericSafe(null)).toBe(0);
      expect(parseNumericSafe(undefined)).toBe(0);
    });

    test('should handle string with numeric prefix', () => {
      expect(parseNumericSafe('123abc')).toBe(123);
      expect(parseNumericSafe('45.67xyz')).toBe(45.67);
    });
  });

  describe('parseHeaderTotal', () => {
    test('should extract x-total from headers', () => {
      const headers = { 'x-total': '1000' };
      expect(parseHeaderTotal(headers)).toBe(1000);
    });

    test('should return fallback if x-total is missing', () => {
      const headers = { 'content-type': 'application/json' };
      expect(parseHeaderTotal(headers, 50)).toBe(50);
    });

    test('should return fallback for invalid x-total', () => {
      const headers = { 'x-total': 'invalid' };
      expect(parseHeaderTotal(headers, 42)).toBe(42);
    });

    test('should handle null headers', () => {
      expect(parseHeaderTotal(null, 100)).toBe(100);
      expect(parseHeaderTotal(undefined, 100)).toBe(100);
    });
  });
});
