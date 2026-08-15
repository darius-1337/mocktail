import type { Kind } from '../../contracts.js';
import { writeDatetime } from '../datetime/format.js';
import { buildInstant, RANGE_PARAMS } from '../datetime/instant.js';
import { validateDatetimeSql } from './validator.js';

export const datetimeSql: Kind = {
      id: 'datetime-sql',
  label: 'SQL DATETIME',
  description:
    'Timestamp in SQL DATETIME form (2026-08-15 22:57:00): space separator, no time zone, which is what MySQL and PostgreSQL DATETIME columns accept. Higher bands produce midnight and end-of-day boundaries, the Unix epoch and the 2038 limit. Use the datetime kind instead for JSON and API payloads.',
  params: RANGE_PARAMS as never,
  generate: (rng, opts) => {
    const instant = buildInstant(rng, opts);
    return writeDatetime(
      opts.valid === false ? { ...instant, hour: 24 } : instant,
      'sql',
    );
  },
  validate: validateDatetimeSql,
};

export { validateDatetimeSql };