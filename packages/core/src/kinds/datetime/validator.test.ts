import { describe, expect, it } from 'vitest';
import { validateDateTime } from './validator.js';

describe('validateDatetime', () => {
  it.each([
    '2026-08-15T22:57:00Z',
    '1970-01-01T00:00:00Z',
    '2038-01-19T03:14:07Z',
    '2024-02-29T12:00:00+01:00',
    '9999-12-31T23:59:59Z',
    '2026-08-15T22:57:00.123Z',
  ])('accepts %s', (v) => {
    const r = validateDateTime(v);
    expect(r.valid, r.reason).toBe(true);
  });

  it.each([
    '2026-08-15T22:57:00+05:45',
    '2026-08-15T22:57:00+12:45',
    '2026-08-15T22:57:00-09:30',
    '2026-08-15T00:00:00+14:00',
    '2026-08-15T00:00:00-12:00',
  ])('accepts non-integer offset %s', (v) => {
    expect(validateDateTime(v).valid).toBe(true);
  });

  it('accepts a leap second', () => {
    expect(validateDateTime('2016-12-31T23:59:60Z').valid).toBe(true);
  });

  it('rejects 29 February in a non-leap year', () => {
    const r = validateDateTime('2023-02-29T00:00:00Z');
    expect(r.valid).toBe(false);
    expect(r.reason).toMatch(/day/i);
  });

  it.each([
    ['2026-08-15T24:00:00Z', 'hour 24'],
    ['2026-08-15T22:60:00Z', 'minute 60'],
    ['2026-08-15T22:57:00', 'no offset'],
    ['2026-08-15 22:57:00Z', 'space instead of T'],
    ['2026-13-01T00:00:00Z', 'month 13'],
    ['2026-08-15T22:57:00+15:00', 'offset beyond +14'],
    ['2026-08-15T22:57:00+14:30', 'offset beyond +14'],
    ['2026-08-15', 'date only'],
    ['', 'empty'],
  ])('rejects %s (%s)', (v) => {
    expect(validateDateTime(v).valid).toBe(false);
  });
});