import { describe, expect, it } from 'vitest';
import { validateIban } from './validator.js';

describe('validateIban', () => {
    it.each([
        'ES9121000418450200051332',
    'DE89370400440532013000',
    'GB29NWBK60161331926819',
    'MT84MALT011000012345MTLCAST001S',
    'NO9386011117947',
  ])('accepts valid IBAN %s', (value) => {
    expect(validateIban(value).valid).toBe(true);
  });

  it('accepts lowercase and spaces', () => {
    expect(validateIban('es91 2100 0418 4502 0005 1332').valid).toBe(true);
  });

  it('rejects a broken check digit', () => {
    const r = validateIban('DE89370400440532013001');
    expect(r.valid).toBe(false);
    expect(r.reason).toMatch(/checksum/i);
  });

  it('rejects wrong length for the country code', () => {
    const r = validateIban('ES912100041845020005133');
    expect(r.valid).toBe(false);
    expect(r.reason).toMatch(/length/i);
  });

  it.each(['', 'ES', 'XX9121000418450200051332', '1291000418450200051332'])(
    'rejects malformed %s', (value) => {
        expect(validateIban(value).valid).toBe(false);
    },
  );
});