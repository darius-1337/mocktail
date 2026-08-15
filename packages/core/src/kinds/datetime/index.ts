import type { Kind } from '../../contracts.js';
import { generateDatetime } from './generator.js';
import { validateDateTime } from './validator.js';
import { RANGE_PARAMS } from './instant.js';


export const datetime: Kind = {
  id: 'datetime',
  label: 'Date and time with offset',
  description:
    'ISO 8601 instant with a UTC offset (2026-08-15T22:57:00Z). Higher bands produce non-integer offsets such as +05:45 and +12:45, midnight and end-of-day boundaries, and instants that break systems: the Unix epoch and the 2038 signed 32-bit limit. Leap seconds (23:59:60) are accepted as valid, since ISO 8601 allows them even though most parsers reject them. Use datetime-sql for database columns.',
  params: RANGE_PARAMS,
  generate: generateDatetime,
  validate: validateDateTime,
};

export { generateDatetime, validateDateTime };