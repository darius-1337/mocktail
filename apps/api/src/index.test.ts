import { registry } from '@mocktail/core';
import { describe, expect, it } from 'vitest';
import app from './index.js';

const get = (path: string) => app.request(path);

const post = (path: string, body: unknown) =>
  app.request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

// biome-ignore lint/suspicious/noExplicitAny: response shape is asserted below
const json = (res: Response): Promise<any> => res.json();

describe('GET /', () => {
  it('lists available kinds and bands', async () => {
    const res = await get('/');
    expect(res.status).toBe(200);

    const body = await json(res);
    expect(body.kinds).toContain('es-dni');
    expect(body.kinds).toContain('iban-es');
    expect(body.bands.length).toBeGreaterThan(0);
  });
});

describe('GET /v1/gen/:kind', () => {
  it('returns the expected shape', async () => {
    const res = await get('/v1/gen/es-dni');
    expect(res.status).toBe(200);

    const body = await json(res);
    expect(body.kind).toBe('es-dni');
    expect(body.data).toHaveLength(1);
    expect(typeof body.seed).toBe('string');
  });

  it('always echoes back the seed it used', async () => {
    const body = await json(await get('/v1/gen/es-dni'));
    const repeat = await json(await get(`/v1/gen/es-dni/${body.seed}`));
    expect(repeat.data).toEqual(body.data);
  });

  it('honours count', async () => {
    const body = await json(await get('/v1/gen/es-dni?count=25'));
    expect(body.data).toHaveLength(25);
  });

  // 404 test
//  it('returns 404 for an unknown kind', async () => {
//  const res = await get('/v1/gen/does-not-exist');
//  console.log('STATUS', res.status, 'BODY', await res.clone().text());
//  expect(res.status).toBe(404);
//  expect((await json(res)).available).toBeInstanceOf(Array);
//});
it('returns 404 for an unknown kind', async () => {
  const res = await get('/v1/gen/does-not-exist');
  expect(res.status).toBe(404);

  const body = await json(res);
  expect(body.available).toBeInstanceOf(Array);
  expect(body.error).toContain('does-not-exist');
});

  it.each(['nope', 'SIMPLE', ''])('returns 400 for invalid band %s', async (band) => {
    const res = await get(`/v1/gen/es-dni?band=${band}`);
    expect(res.status).toBe(400);
  });

  it.each(['0', '-5', '1001', 'abc', '1.5'])(
    'returns 400 for invalid count %s',
    async (count) => {
      const res = await get(`/v1/gen/es-dni?count=${count}`);
      expect(res.status).toBe(400);
    },
  );
});

describe('GET /v1/gen/:kind/:seed', () => {
  it('is deterministic across requests', async () => {
    const a = await json(await get('/v1/gen/iban-es/fixed-seed?count=5'));
    const b = await json(await get('/v1/gen/iban-es/fixed-seed?count=5'));
    expect(a.data).toEqual(b.data);
  });

  it('produces different data for different seeds', async () => {
    const a = await json(await get('/v1/gen/iban-es/seed-a?count=5'));
    const b = await json(await get('/v1/gen/iban-es/seed-b?count=5'));
    expect(a.data).not.toEqual(b.data);
  });
});

describe('cross-layer: served data honours the contract', () => {
  it.each([...registry.keys()])('everything served for %s validates', async (kind) => {
    const body = await json(await get(`/v1/gen/${kind}?count=50&band=hostile`));
    const validator = registry.get(kind);

    for (const value of body.data) {
      expect(validator?.validate(value).valid, `${kind}: ${value}`).toBe(true);
    }
  });

  it('valid=false serves data the validator rejects', async () => {
    const body = await json(await get('/v1/gen/es-dni?count=50&valid=false'));
    for (const value of body.data) {
      expect(registry.get('es-dni')?.validate(value).valid).toBe(false);
    }
  });
});

describe('POST /v1/validate/:kind', () => {
  it('accepts a known-good value', async () => {
    const res = await post('/v1/validate/es-dni', { value: '12345678Z' });
    expect((await json(res)).valid).toBe(true);
  });

  it('rejects and explains a bad value', async () => {
    const body = await json(await post('/v1/validate/es-dni', { value: '12345678A' }));
    expect(body.valid).toBe(false);
    expect(body.reason).toBeTruthy();
  });

  it('returns 404 for an unknown kind', async () => {
    expect((await post('/v1/validate/nope', { value: 'x' })).status).toBe(404);
  });

  it.each([{}, { value: 42 }, { valor: 'x' }])(
    'returns 400 for malformed body %j',
    async (body) => {
      expect((await post('/v1/validate/es-dni', body)).status).toBe(400);
    },
  );
});