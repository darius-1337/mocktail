import type { Kind } from "./contracts.js";
import { esDni } from "./kinds/es-dni/index.js";

const kinds = [esDni] as const;

export const registry: ReadonlyMap<string, Kind> = new Map(
	kinds.map((kind) => [kind.id, kind]),
);
export const kindIds: readonly string[] = kinds.map((kind) => kind.id);