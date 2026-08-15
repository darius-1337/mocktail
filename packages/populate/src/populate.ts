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

export function populate(req: PopulateRequest): readonly Row[] {
  const count = Math.min(Math.max(req.count, 1), 10_000);
  const defaultBand = req.band ?? 'realistic';
  const entries = Object.entries(req.fields);

  if (entries.length === 0) throw new PopulateError('fields cannot be empty');

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