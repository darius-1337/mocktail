import {
	InvalidParamError,
	InvalidSeedError,
	kindIds,
	UnknownKindError,
} from "@mocktail/core";
import { PopulateError, UnsafeIdentifierError } from "@mocktail/populate";
import type { Context } from "hono";

interface Mapping {
	readonly status: 400 | 404;
	readonly body: (error: Error) => Record<string, unknown>;
}

const MAPPINGS: readonly (readonly [
	new (...args: never[]) => Error,
	Mapping,
])[] = [
	[
		UnknownKindError,
		{
			status: 404,
			body: (e) => ({ error: e.message, available: kindIds }),
		},
	],
	[
		InvalidParamError,
		{
			status: 400,
			body: (e) => ({
				error: "invalid parameter",
				...(e as InvalidParamError).problem,
			}),
		},
	],
	[
		InvalidSeedError,
		{ status: 400, body: (e) => ({ error: e.message, parameter: "seed" }) },
	],
	[
		PopulateError,
		{ status: 400, body: (e) => ({ error: e.message, available: kindIds }) },
	],
	[UnsafeIdentifierError, { status: 400, body: (e) => ({ error: e.message }) }],
];

export function toErrorResponse(c: Context, error: unknown) {
	if (!(error instanceof Error)) return null;

	for (const [type, mapping] of MAPPINGS) {
		if (error instanceof type)
			return c.json(mapping.body(error), mapping.status);
	}
	return null;
}
