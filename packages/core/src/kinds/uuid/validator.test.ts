import { describe, expect, it } from 'vitest';
import { validateUuid } from './validator.js';

describe('validateUuid', () => {
  it.each([
    'f81d4fae-7dec-41d0-a765-00a0c91e6bf6',
    '00000000-0000-0000-0000-000000000000',
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
  ])('accepts canonical %s', (v) => {
    expect(validateUuid(v).valid).toBe(true);
  });

  it('accepts uppercase', () => {
    expect(validateUuid('F81D4FAE-7DEC-41D0-A765-00A0C91E6BF6').valid).toBe(true);
  });

  it('rejects a version mismatch', () => {
    const r = validateUuid('f81d4fae-7dec-41d0-a765-00a0c91e6bf6', 7);
    expect(r.valid).toBe(false);
    expect(r.reason).toMatch(/version/i);
  });

  it('rejects bad variant bits', () => {
    const r = validateUuid('f81d4fae-7dec-41d0-0765-00a0c91e6bf6');
    expect(r.valid).toBe(false);
    expect(r.reason).toMatch(/variant/i);
  });

  it.each([
    '',
    'not-a-uuid',
    'f81d4fae7dec41d0a76500a0c91e6bf6',
    'f81d4fae-7dec-41d0-a765-00a0c91e6bf',
    'g81d4fae-7dec-41d0-a765-00a0c91e6bf6',
  ])('rejects malformed %s', (v) => {
    expect(validateUuid(v).valid).toBe(false);
  });
});