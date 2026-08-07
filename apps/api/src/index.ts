import {
	BANDS,
	generate,
	isBand,
	kindIds,
	randomSeed,
	registry,
	UnknownKindError,
} from "@mocktail/core";
import { type Context, Hono } from "hono";
import { cors } from "hono/cors";

const app = new Hono();
app.use("/*", cors());

app.get("/", (c) =>
	c.json({
		name: "mocktail",
		description: "Deterministic test data with complexity dialed ",
		kinds: kindIds,
		bands: BANDS,
		examples: [
			"/v1/gen/es.dni",
			"/v1/gen/es.dni?band=hostil&count=5",
			"/v1/gen/es.dni/my-seed-123?band=limit",
		],
	}),
);

function handle(c: Context, seed: string) {
	const kind = c.req.param("kind") ?? "";
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

	try {
		return c.json(
			generate({
				kind,
				seed,
				band: bandParam,
				count: countParam,
				valid: c.req.query("valid") !== "false",
			}),
		);
	} catch (error) {
		if (error instanceof UnknownKindError) {
			return c.json({ error: error.message, available: kindIds }, 400);
		}
		throw error;
	}
}

app.get("/v1/gen/:kind", (c) => handle(c, randomSeed()));
app.get("/v1/gen/:kind/:seed", (c) =>
	handle(c, c.req.param("seed") ?? randomSeed()),
);

app.post("/v1/gen/:kind", async (c) => {
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

export default app;
