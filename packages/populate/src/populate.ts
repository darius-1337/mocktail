import { type Band, registry, seedFrom, splitmix64 } from '@mocktail/core';
import { generatePrimitive, type PrimitiveSpec } from './primitives.js';
import type { Row } from './format.js';



export type FieldSpec =
  | string
  | { readonly kind: string; readonly band?: Band; readonly params?: Record<string, string> }
  | PrimitiveSpec;

export interface PopulateRequest {
  readonly seed: string;
  readonly count: number;
  readonly band?: Band;
  readonly fields: Readonly<Record<string, FieldSpec>>;
}

const PRIMITIVE_KINDS = new Set(['string', 'integer', 'number', 'boolean', 'enum']);

const isPrimitive = (spec: FieldSpec): spec is PrimitiveSpec =>
  typeof spec === 'object' && PRIMITIVE_KINDS.has(spec.kind);

export class PopulateError extends Error {}

export const MAX_ROWS = 10_000;
export const MAX_FIELDS = 50;
export const MAX_CELLS = 100_000;

export function populate(req: PopulateRequest): readonly Row[] {
  const defaultBand = req.band ?? 'realistic';
  const entries = Object.entries(req.fields);

  if (entries.length === 0) throw new PopulateError('fields cannot be empty');
  if (entries.length > MAX_FIELDS) {
    throw new PopulateError(`at most ${MAX_FIELDS} fields, got ${entries.length}`);
  }

  const count = Math.min(Math.max(req.count, 1), MAX_ROWS);

  if (count * entries.length > MAX_CELLS) {
    throw new PopulateError(
      `count x fields must not exceed ${MAX_CELLS}, got ${count * entries.length}`,
    );
  }

    for (const [name, spec] of entries) {
    if (isPrimitive(spec)) continue;
    const id = typeof spec === 'string' ? spec : spec.kind;
    if (!registry.has(id)) {
      throw new PopulateError(`unknown kind "${id}" for field "${name}"`);
    }
  }

  const rows: Row[] = [];

  for (let row = 0; row < count; row++) {
    const record: Record<string, string | number | boolean | null> = {};

    for (const [name, spec] of entries) {
      const rng = splitmix64(seedFrom(`${req.seed}:${name}:${row}`));

      if (isPrimitive(spec)) {
        record[name] = generatePrimitive(spec, rng, defaultBand === 'hostile');
        continue;
      }

      const id = typeof spec === 'string' ? spec : spec.kind;
      const band = typeof spec === 'string' ? defaultBand : (spec.band ?? defaultBand);
      const params = typeof spec === 'string' ? {} : (spec.params ?? {});

      const kind = registry.get(id);
      record[name] = kind === undefined ? null : kind.generate(rng, { band, params });
    }

    rows.push(record);
  }

  return rows;
}