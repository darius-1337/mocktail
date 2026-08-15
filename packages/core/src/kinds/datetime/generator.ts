import type { GeneratedOptions } from '../../contracts.js';
import type { Rng } from '../../rng/splitmix64.js';
import { writeDatetime } from './format.js';
import { buildInstant } from './instant.js';

export function generateDatetime(rng: Rng, opts: GeneratedOptions): string {
  const instant = buildInstant(rng, opts);
  return writeDatetime(
    opts.valid === false ? { ...instant, hour: 24 } : instant,
    'iso',
  );
}