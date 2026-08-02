import { describe, expect, it } from 'vitest';
import { validateDni } from './validator.js';

describe('validateDni', () => {
    it.each([
        '12345678Z', '00000000T', '00000001R',
    '99999999R', '55555555K', '46026445H',
    ])('accepts valid DNI %s', (value) => {
        expect(validateDni(value).valid).toBe(true);

    });

    it('rejects wrong letter', () => {
        const result = validateDni('12345678A');
        expect(result.valid).toBe(false);
        expect(result.reason).toMatch(/letter/i);
    });

    it.each([
    ['1234567Z', 'muy corto'],
    ['123456789Z', 'muy largo'],
    ['12345678', 'sin letra'],
    ['1234567AZ', 'letra en medio'],
    ['', 'vacío'],
  ])('rejects %s (%s)', (v) => {
    expect(validateDni(v).valid).toBe(false);
  });

    it.each(['12345678I', '12345678O', '12345678U', '12345678Ñ'])(
    'rejects %s: letter excluded from table', (v) => {
      expect(validateDni(v).valid).toBe(false);
    },
  );

 it('accepts lowercase and spaces around', () => {
    expect(validateDni('  12345678z  ').valid).toBe(true);
  });

});