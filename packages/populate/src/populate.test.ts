import { describe, expect, it } from 'vitest';
import { populate } from './populate.js';
import { toCsv, toSql } from './format.js';

describe('populate', () => {
  const req = {
    seed: 'demo',
    count: 3,
    band: 'hostile' as const,
    fields: {
      id: 'uuid-v7',
      dni: 'es-dni',
      email: 'email',
      age: { kind: 'integer' as const, min: 18, max: 99 },
      active: { kind: 'boolean' as const },
    },
  };

  it('produces the requested number of rows', () => {
    expect(populate(req)).toHaveLength(3);
  });

  it('is deterministic', () => {
    expect(populate(req)).toEqual(populate(req));
  });

  it('adding a field does not change existing ones', () => {
    const before = populate(req);
    const after = populate({ ...req, fields: { ...req.fields, phone: 'es-dni' } });

    for (let i = 0; i < before.length; i++) {
      expect(after[i]?.email).toBe(before[i]?.email);
      expect(after[i]?.dni).toBe(before[i]?.dni);
    }
  });

  it('renders SQL and CSV', () => {
    const rows = populate(req);
    expect(toSql('users', rows)).toContain('INSERT INTO users');
    expect(toCsv(rows).split('\n')[0]).toBe('id,dni,email,age,active');
  });
});