import { describe, expect, it } from 'vitest';
import { validateDatetimeSql } from './validator.js';

describe('validateDatetimeSql', () => {
  it.each([
    '2026-08-15 22:57:00',
    '1970-01-01 00:00:00',
    '2038-01-19 03:14:07',
    '2024-02-29 12:00:00',
    '9999-12-31 23:59:59',
    '2026-08-15 22:57:00.123456',
  ])('accepts %s', (v) => {
    const r = validateDatetimeSql(v);
    expect(r.valid, r.reason).toBe(true);
  });

  it.each([
    '2026-08-15T22:57:00Z',
    '2026-08-15T22:57:00',
    '2026-08-15 22:57:00Z',
    '2026-08-15 22:57:00+02:00',
  ])('rejects the ISO form %s', (v) => {
    expect(validateDatetimeSql(v).valid).toBe(false);
  });

  it('rejects 29 February in a non-leap year', () => {
    const r = validateDatetimeSql('2023-02-29 00:00:00');
    expect(r.valid).toBe(false);
    expect(r.reason).toMatch(/day/i);
  });

  it.each([
    '2026-08-15 24:00:00',
    '2026-08-15 22:60:00',
    '2026-13-01 00:00:00',
    '2026-08-15',
    '',
  ])('rejects malformed %s', (v) => {
    expect(validateDatetimeSql(v).valid).toBe(false);
  });
});