import type { ValidationResult } from "../../contracts";

const ATEXT = /^[A-Za-z0-9!#$%&'*+\-/=?^_`{|}~]+$/;

export const MAX_LOCAL = 64;
export const MAX_DOMAIN = 255;
export const MAX_TOTAL = 254;

function checkLocal(local: string): string | null {
    if(local.length === 0) return 'empty local part';
    if(local.length > MAX_LOCAL) return `the maximum characters allowed for local part is ${MAX_LOCAL}`;

    if(local.startsWith('"') && local.endsWith('"') && local.length >= 2) {
        const inner = local.slice(1, -1);
        let i = 0;

        while(i < inner.length) {
            const c = inner[i] ?? '';

            if(c === '\\') {
                if(i + 1 >= inner.length) return 'dangling escape in quoted local part';

                i += 2;
                continue;
            }

            if(c === '"') return 'unescaped quote in quoted local part';
            const cp = c.charCodeAt(0);

            if(cp < 32 || cp === 127) return 'control character in quoted local part';
            i++;
        }

            return null;
    }

    if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) {
    return 'invalid dot placement in local part';
  }
  for (const part of local.split('.')) {
    if (!ATEXT.test(part)) return 'invalid character in local part';
  }
  return null;
}

function checkDomain(domain: string): string | null {
  if (domain.length === 0) return 'empty domain';
  if (domain.length > MAX_DOMAIN) return `domain exceeds ${MAX_DOMAIN} characters`;

  // using literal ip ex: user@[192.0.2.1] o user@[IPv6:2001:db8::1]
  if (domain.startsWith('[') && domain.endsWith(']')) {
    const literal = domain.slice(1, -1);
    if (literal.startsWith('IPv6:')) {
      return /^[0-9A-Fa-f:.]+$/.test(literal.slice(5)) ? null : 'malformed IPv6 literal';
    }
    const octets = literal.split('.');
    const ok =
      octets.length === 4 &&
      octets.every((o) => /^\d{1,3}$/.test(o) && Number(o) <= 255);
    return ok ? null : 'malformed IPv4 literal';
  }

  if (domain.startsWith('.') || domain.endsWith('.') || domain.includes('..')) {
    return 'invalid dot placement in domain';
  }
  for (const label of domain.split('.')) {
    if (label.length === 0 || label.length > 63) return 'invalid domain label length';
    if (!/^[A-Za-z0-9-]+$/.test(label)) return 'invalid character in domain label';
    if (label.startsWith('-') || label.endsWith('-')) return 'domain label edge hyphen';
  }
  return null;
}

function splitAtSign(email: string): readonly [string, string] | null {
  if (email.startsWith('"')) {
    let i = 1;
    while (i < email.length) {
      if (email[i] === '\\') {
        i += 2;
        continue;
      }
      if (email[i] === '"') {
        return email[i + 1] === '@'
          ? [email.slice(0, i + 1), email.slice(i + 2)]
          : null;
      }
      i++;
    }
    return null;
  }
  const at = email.lastIndexOf('@');
  return at <= 0 ? null : [email.slice(0, at), email.slice(at + 1)];
}

export function validateEmail(input: string): ValidationResult {
  if (input.length === 0) return { valid: false, reason: 'empty' };
  if (input.length > MAX_TOTAL) return { valid: false, reason: `exceeds ${MAX_TOTAL} characters` };

  const parts = splitAtSign(input);
  if (parts === null) return { valid: false, reason: 'missing or misplaced @' };

  const [local, domain] = parts;

  const localError = checkLocal(local);
  if (localError !== null) return { valid: false, reason: localError };

  const domainError = checkDomain(domain);
  if (domainError !== null) return { valid: false, reason: domainError };

  return { valid: true };
}