import type { Rng } from "@mocktail/core";

export interface PrimitiveSpec {
	readonly kind: "string" | "integer" | "number" | "boolean" | "enum";
	readonly min?: number;
	readonly max?: number;
	readonly values?: readonly string[];
	readonly nullable?: boolean;
}

const ASCII = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** Fragmentos que revientan cosas: apóstrofos, acentos, RTL, emoji. */
const HOSTILE_TEXT = [
	"O'Brien",
	"Müller-Schmidt",
	"İstanbul",
	"日本語テキスト",
	"עברית",
	"  leading and trailing  ",
	"null",
	"<script>alert(1)</script>",
	"💀 emoji",
] as const;

export function generatePrimitive(
	spec: PrimitiveSpec,
	rng: Rng,
	hostile: boolean,
): string | number | boolean | null {
	if (spec.nullable === true && rng.float() < 0.1) return null;

	switch (spec.kind) {
		case "boolean":
			return rng.float() < 0.5;

		case "integer": {
			const min = spec.min ?? 0;
			const max = spec.max ?? 1000;
			if (hostile && rng.float() < 0.4) return rng.float() < 0.5 ? min : max;
			return min + rng.int(max - min + 1);
		}

		case "number": {
			const min = spec.min ?? 0;
			const max = spec.max ?? 1000;
			return Number((min + rng.float() * (max - min)).toFixed(2));
		}

		case "enum": {
			const values = spec.values ?? ["A", "B", "C"];
			return values[rng.int(values.length)] ?? "A";
		}

		case "string": {
			const max = spec.max ?? 32;
			const min = spec.min ?? 1;

			// A banda alta: texto que rompe cosas, recortado al máximo permitido
			if (hostile && rng.float() < 0.6) {
				const text = HOSTILE_TEXT[rng.int(HOSTILE_TEXT.length)] ?? "x";
				return [...text].slice(0, max).join("") || "x";
			}

			const length = min + rng.int(Math.max(max - min + 1, 1));
			return Array.from(
				{ length },
				() => ASCII[rng.int(ASCII.length)] ?? "a",
			).join("");
		}
	}
}
