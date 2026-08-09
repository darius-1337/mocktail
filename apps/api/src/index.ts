import {
	BANDS,
	detectConfusable,
	generate,
	InvalidParamError,
	isBand,
	kindIds,
	MAX_SEED_LENGTH,
	randomSeed,
	registry,
	seedFrom,
	splitmix64
} from "@mocktail/core";
import { type Context, Hono } from "hono";
import { cors } from "hono/cors";

const app = new Hono();
app.use("/*", cors());

const RESERVED = new Set(["band", "count", "valid"]);

app.get("/", (c) =>
	c.json({
		name: "mocktail",
		description: "Deterministic test data with complexity dialed ",
		kinds: kindIds,
		bands: BANDS,
		examples: [
			"/v1/gen/es-dni",
			"/v1/gen/es-dni?band=hostile&count=5",
			"/v1/gen/es-dni/my-seed-123?band=limit",
		],
	}),
);

app.get('/v1/kinds', (c) =>
  c.json({
    count: registry.size,
    kinds: [...registry.values()].map((kind) => ({
      id: kind.id,
      label: kind.label,
      description: kind.description,
      example: kind.generate(splitmix64(seedFrom('example')), { band: 'simple' }),
      url: `/v1/gen/${kind.id}`,
    })),
  }),
);

function handle(c: Context, seed: string, seeded: boolean) {
	const kind = c.req.param("kind") ?? "";

	if(!registry.has(kind)) {
		return c.json({ error: `unknown kind: ${kind}`, available: kindIds }, 404);
	}

	const bandParam = c.req.query("band") ?? "realistic";
	const countParam = Number(c.req.query("count") ?? "1");

	if (!isBand(bandParam)) {
		return c.json({ error: "Invalid band", allowed: BANDS }, 400);
	}

	if (!Number.isInteger(countParam) || countParam < 1 || countParam > 1000) {
		return c.json(
			{ error: "count must be an integer between 1 and 1000" },
			400,
		);
	}

	if(seed.length > MAX_SEED_LENGTH) {
		return c.json({error: `seed cannot exceed ${MAX_SEED_LENGTH} characters.`}, 400);
	}

	const params = Object.fromEntries(
		[...new URL(c.req.url).searchParams].filter(([key]) => !RESERVED.has(key)),
	);

	try {
		const res = c.json(
			generate({
				kind: kind,
				seed,
				band: bandParam,
				count: countParam,
				valid: c.req.query("valid") !== "false",
				params,
			}),
		);

		res.headers.set(
			"Cache-Control",
			seeded ? "public, max-age=31526000, immutable" : "no-store",
		);

		return res;

	} catch (error) {
		if(error instanceof InvalidParamError) {
			return c.json({ error: error.message }, 400);
		}

		throw error;
	}
}

app.get("/v1/gen/:kind", (c) => handle(c, randomSeed(), false));
app.get("/v1/gen/:kind/:seed", (c) =>
	handle(c, c.req.param('seed') ?? '', true),
);

app.post("/v1/validate/:kind", async (c) => {
	const kind = registry.get(c.req.param("kind") ?? "");
	if (kind === undefined) {
		return c.json({ error: "Unknown kind", available: kindIds }, 404);
	}

	const body = await c.req.json<{ value?: string }>();
	if (typeof body.value !== "string") {
		return c.json({ error: 'Body must be { "value": "..." }' }, 400);
	}
	return c.json({
		kind: kind.id,
		value: body.value,
		...kind.validate(body.value),
	});
});

app.post("/v1/analyze/domain", async (c) => {
	const body = await c.req.json<{ value?: string }>();
	if (typeof body.value !== "string") {
		return c.json({ error: 'Body must be { "value": "..." }' }, 400);
	}
	return c.json({ value: body.value, ...detectConfusable(body.value) });
});

app.onError((err, c) => {
	console.error(err);
	return c.json({ error: "Internal error" }, 500);
});

export default app;
