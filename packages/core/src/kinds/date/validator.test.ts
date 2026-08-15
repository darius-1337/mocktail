import { describe, expect, it } from 'vitest';
import { fromEpochDay, isLeapYear, toEpochDay, validateDate } from './validator.js';

describe('isLeapYear', () => {
  it.each([2024, 2000, 2400, 1996])('%d is a leap year', (y) => {
    expect(isLeapYear(y)).toBe(true);
  });

    it.each([1900, 2100, 2023, 2200])('%d is not a leap year', (y) => {
    expect(isLeapYear(y)).toBe(false);
  });
});

describe('epoch day conversion', () => {
  it.each([
    [1970, 1, 1, 0],
    [2000, 2, 29, 11016],
    [2024, 2, 29, 19782],
    [2038, 1, 19, 24855],
    [9999, 12, 31, 2932896],
  ])('%d-%d-%d is epoch day %d', (y, m, d, expected) => {
    expect(toEpochDay(y, m, d)).toBe(expected);
  });

    it('round-trips every day from 1900 to 2100', () => {
    for (let ed = -25567; ed < 47482; ed++) {
      const [y, m, d] = fromEpochDay(ed);
      expect(toEpochDay(y, m, d)).toBe(ed);
    }
  });
});

describe('validateDate', () => {
  it.each(['1970-01-01', '2024-02-29', '2000-02-29', '9999-12-31', '2038-01-19'])(
    'accepts %s',
    (v) => {
      expect(validateDate(v).valid).toBe(true);
    },
  );

    it('rejects 29 February in a non-leap year', () => {
    const r = validateDate('2023-02-29');
    expect(r.valid).toBe(false);
    expect(r.reason).toMatch(/day/i);
  });

    it('rejects 29 February 1900, a non-leap century', () => {
    expect(validateDate('1900-02-29').valid).toBe(false);
  });

    it.each([
    '2024-13-01',
    '2024-00-15',
    '2024-04-31',
    '2024-1-1',
    '24-01-01',
    '2024/01/01',
    '',
  ])('rejects malformed %s', (v) => {
    expect(validateDate(v).valid).toBe(false);
  });
});