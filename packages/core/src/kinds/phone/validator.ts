import type { ValidationResult } from "../../contracts.js";

export const PHONE_COUNTRIES = {
    us: { code: '1', nsnLength: 10, label: 'United States' },
    gb: { code: '44', nsnLength: 10, label: 'United Kingdom' },
    es: { code: '34', nsnLength: 9, label: 'Spain' },
} as const;

export type PhoneCountry = keyof typeof PHONE_COUNTRIES;
export const PHONE_COUNTRY_IDS = Object.keys(PHONE_COUNTRIES) as readonly PhoneCountry[];

const E164 = /^\+[1-9]\d{1,14}$/;

export function normalisePhone(input: string): string {
  const trimmed = input.trim().replace(/\s+/g, '');
  const stripped = trimmed.replace(/[()\-.]/g, '');
  return stripped.startsWith('00') ? `+${stripped.slice(2)}` : stripped;
}

export function validatePhone(input: string, country?: PhoneCountry): ValidationResult {
  const value = normalisePhone(input);

    if (country !== undefined && /^\d+$/.test(value)) {
    const spec = PHONE_COUNTRIES[country];
    return value.length === spec.nsnLength
      ? { valid: true }
      : {
          valid: false,
          reason: `${spec.label} national numbers have ${spec.nsnLength} digits, got ${value.length}`,
        };
  }

  if (!E164.test(value)) {
    return { valid: false, reason: 'expected E.164 form, e.g. +12125550100' };
  }

  if (country === undefined) return { valid: true };

  const spec = PHONE_COUNTRIES[country];
  const digits = value.slice(1);

  if (!digits.startsWith(spec.code)) {
    return { valid: false, reason: `expected country code +${spec.code} for ${country}` };
  }

  const nsn = digits.slice(spec.code.length);
  if (nsn.length !== spec.nsnLength) {
    return {
      valid: false,
      reason: `${spec.label} numbers have ${spec.nsnLength} digits, got ${nsn.length}`,
    };
  }

  return { valid: true };
}