# mocktail

Deterministic test data with a complexity dial, plus homograph attack detection for domains.

Generate identifiers that are **valid according to their real verification algorithm** — Luhn, mod 97, mod 23, RFC 5322 — and choose how *unusual* they are within the space of legal values. Same seed in, same data out, every time.

---

## Why

Production bugs do not show up with `test@example.com` and `John Smith`. They show up with:

- The surname `O'Brien-Müller` that breaks SQL escaping without parameterized queries.
- The Spanish DNI with leading zeros that someone stored as `INT`.
- The 19-digit card number that does not fit in `VARCHAR(16)`.
- The email `"very.(),:;<>[]\".unusual"@example.com`, valid per RFC 5322, that defeats almost every regex in production.
- The domain that looks exactly like yours but is written in Cyrillic.

Mocktail gives you the strangest value that is still valid, and lets you reproduce it forever from a seed.

---

## Quick start

No installation, no API key.

```
curl https://mocktail.example.dev/v1/gen/es-dni
```

```json
{
  "kind": "es-dni",
  "label": "Spanish DNI/NIE",
  "seed": "a3f2b8c1d4e5f607",
  "band": "realistic",
  "valid": true,
  "count": 1,
  "params": {},
  "data": ["74568178Q"]
}
```

Ask for stranger data, and more of it:

```
curl 'https://mocktail.example.dev/v1/gen/es-dni?band=hostile&count=5'
```

```json
{
  "data": ["Z1799672L", "X8418515D", "Y1653895W", "00000000T", "X2856386Q"]
}
```

Pin a seed and the result never changes:

```
curl https://mocktail.example.dev/v1/gen/iban-es/my-seed-123
```

---

## Security auditing: homograph attacks

A homograph attack registers a domain visually identical to a legitimate one, using characters from another alphabet. The Cyrillic `а` (U+0430) and the Latin `a` (U+0061) render identically in almost every font, but they are different characters, resolve to different domains, and can hold different TLS certificates.

mocktail does two things here: it **generates** these domains so you can test your defences, and it **analyses** them so you can catch them.

### Analysing a domain

```
curl -X POST https://mocktail.example.dev/v1/analyze/domain \
  -H 'Content-Type: application/json' \
  -d '{"value":"аpple.com"}'
```

```json
{
  "value": "аpple.com",
  "suspicious": true,
  "severity": "high",
  "scripts": ["Cyrillic", "Latin"],
  "mixedLabels": ["аpple"],
  "punycode": false,
  "reason": "mixed scripts within label(s): аpple"
}
```

### Severity levels

| Severity | Meaning | Example |
| --- | --- | --- |
| `none` | Single script throughout. No indicators. | `apple.com`, `пример.рф` |
| `low` | Punycode input. Cannot be analysed until decoded. | `xn--e1awd7f.com` |
| `medium` | Labels internally consistent, but the domain as a whole mixes scripts. | `ерісgames.com`, an all-Cyrillic label under a Latin TLD |
| `high` | A single label mixes scripts. Almost never legitimate. | `pаypal.com` |

The distinction between `medium` and `high` matters. A legitimate Russian business may register `пример.com`, mixing a Cyrillic label with a Latin TLD. But mixing scripts *inside one word* has essentially no legitimate use — it exists to make a Cyrillic word look Latin.

Note that `пример.рф` is correctly cleared. A genuine non-Latin domain uses one script consistently; an attack mixes them, because the remaining characters must still resemble the original.

### Generating attack domains

Point it at any domain, including your own:

```
curl 'https://mocktail.example.dev/v1/gen/domain-homograph?target=yourcompany.com&band=hostile&count=5'
```

Bands map to **detection difficulty**:

| Band | Behaviour | Typical severity |
| --- | --- | --- |
| `simple` | Swaps one character | `high` |
| `realistic` | Swaps a few | `high` |
| `limit` | Swaps most | `high` |
| `hostile` | Swaps every character that has a look-alike | `medium` if the label converts fully |

### Not every brand is equally spoofable

This is a useful finding in itself. A domain can only become a fully Cyrillic label if *every* letter has a convincing look-alike.

| Target | Fully convertible | Why |
| --- | --- | --- |
| `apple.com` | Yes | a, p, p, l, e all have look-alikes |
| `epicgames.com` | Yes | e, p, i, c all have look-alikes |
| `paypal.com` | Yes | |
| `netflix.com` | No | `f` has no Cyrillic look-alike |
| `pccomponentes.es` | No | `n` and `t` have no reliable look-alikes |

Fully convertible domains carry higher risk, because the strongest version of the attack against them evades per-label detection. If your own domain is on that side, it is worth knowing.

### Limitations of the detector

Be clear about what this does not catch:

- **Punycode input.** `xn--e1awd7f.com` is pure ASCII, so script analysis finds nothing. The API reports `low` severity with a note; decode to Unicode before analysing. Decoding is not yet implemented.
- **Whole-script confusables.** A domain entirely in one non-Latin script, under a TLD of that same script, that still resembles a Latin brand. Detecting this requires mapping characters to canonical skeletons and comparing against a list of known brands.
- **Latin-only look-alikes.** `paypa1.com`, with a digit one instead of a letter `l`, mixes no scripts at all. Digits are `Script=Common` and are deliberately ignored.

Script analysis is one signal. It belongs alongside brand lists, certificate transparency monitoring and registration-date heuristics, not in place of them.

---

## The three axes

These are independent. Mixing them up is the most common source of confusion.

| Axis | Controls | Values |
| --- | --- | --- |
| **Seed** | *Which* value you get | Any string up to 256 characters, or omitted for a random one |
| **Band** | *How unusual* it is | `simple`, `realistic`, `limit`, `hostile` |
| **Validity** | Whether it *passes* its algorithm | `valid=true` (default) or `valid=false` |

Changing the seed gives you a different value of the same character. Changing the band moves you along the strangeness spectrum. Changing validity is for testing that your validator correctly *rejects* things.

### A note on the band names

The band axis measures **rarity, not realism**. The least rare data is by definition the most lifelike, so `simple` produces the most realistic-looking values and `hostile` the least.

Bands are not hard boundaries. Each targets a zone of the spectrum and samples around it, so you get variety within a band rather than one fixed shape. This is the approximate distribution of generation strategies for IBAN:

| Band | Ordinary | Varied | Leading zeros | All zeros | All nines |
| --- | --- | --- | --- | --- | --- |
| `simple` | 78.9% | 20.8% | 0.3% | 0.0% | 0.0% |
| `realistic` | 4.6% | 65.9% | 28.7% | 0.8% | 0.1% |
| `limit` | 0.0% | 3.9% | 47.9% | 36.3% | 11.8% |
| `hostile` | 0.0% | 0.0% | 3.5% | 43.1% | 53.3% |

---

## Playground

> Under construction. The generator already runs in the browser, so the
> playground will be a static page with no server cost.

---

## API reference

Base URL: `https://mocktail.example.dev`

### GET /

Service metadata: available kinds, bands and example URLs.

### GET /v1/kinds

Full catalogue with descriptions, parameters and a live example for each kind.

```json
{
  "count": 18,
  "kinds": [
    {
      "id": "domain-homograph",
      "label": "Homograph attack domain",
      "description": "A visually identical copy of a target domain...",
      "example": "аpple.com",
      "params": [
        {
          "name": "target",
          "description": "Domain to spoof, for example yourcompany.com",
          "default": "example.com",
          "required": false
        }
      ],
      "url": "/v1/gen/domain-homograph"
    }
  ]
}
```

The `example` field is generated on request from a fixed seed, so it can never drift out of sync with the generator.

### GET /v1/gen/:kind

Generate values with a server-chosen seed.

| Parameter | In | Default | Description |
| --- | --- | --- | --- |
| `kind` | path | required | Kind id, e.g. `es-dni`, `iban-mt`, `card-visa` |
| `band` | query | `realistic` | `simple`, `realistic`, `limit`, `hostile` |
| `count` | query | `1` | Integer, 1 to 1000 |
| `valid` | query | `true` | `false` returns values that fail validation |

Any other query parameter is passed to the kind as a generation parameter. Unknown parameters are ignored; malformed ones return `400`.

The seed is **always returned**, even when the server picked it, along with the resolved parameters. Copy both into the seeded endpoint to reproduce the exact same values.

### GET /v1/gen/:kind/:seed

Same as above, with an explicit seed. Maximum 256 characters.

Responses from this endpoint are **immutable** and carry `Cache-Control: public, max-age=31536000, immutable`. The same URL returns the same data forever, so CI runs are served from cache rather than recomputed.

### POST /v1/validate/:kind

Check whether a value is valid, and find out why if it is not.

```
curl -X POST https://mocktail.example.dev/v1/validate/es-dni \
  -H 'Content-Type: application/json' \
  -d '{"value":"12345678A"}'
```

```json
{
  "kind": "es-dni",
  "value": "12345678A",
  "valid": false,
  "reason": "Invalid letter, expected Z"
}
```

### POST /v1/analyze/domain

Homograph analysis. See the security section above.

### Errors

| Status | When |
| --- | --- |
| `400` | Invalid `band`, invalid `count`, seed too long, malformed parameter or body |
| `404` | Unknown kind. The response lists all available ids. |

---

## Using it from code

### Shell

```bash
# One value, unquoted, ready to pipe
curl -s 'https://mocktail.example.dev/v1/gen/es-dni' | jq -r '.data[0]'

# Fifty values, one per line
curl -s 'https://mocktail.example.dev/v1/gen/iban-de?count=50' | jq -r '.data[]'

# Capture the seed so the run can be replayed
SEED=$(curl -s 'https://mocktail.example.dev/v1/gen/es-dni' | jq -r '.seed')
echo "Reproduce with: /v1/gen/es-dni/$SEED"

# Spoof your own domain and analyse the result
D=$(curl -s 'https://mocktail.example.dev/v1/gen/domain-homograph?target=yourcompany.com&band=hostile' | jq -r '.data[0]')
curl -s -X POST https://mocktail.example.dev/v1/analyze/domain \
  -H 'Content-Type: application/json' -d "{\"value\":\"$D\"}" | jq
```

### JavaScript and TypeScript

Installing the library.

```bash
npm install @mocktail/core
```

```ts
import { generate, detectConfusable } from '@mocktail/core';

const { data } = generate({
  kind: 'es-dni',
  seed: 'user-service-tests',
  band: 'hostile',
  count: 10,
});

const report = detectConfusable('аpple.com');
if (report.suspicious) {
  console.warn(report.reason);
}
```

### Python

```python
import requests

r = requests.get(
    "https://mocktail.example.dev/v1/gen/iban-es",
    params={"band": "hostile", "count": 10},
)
payload = r.json()
print(payload["data"], payload["seed"])
```

### Java

```java
var uri = URI.create("https://mocktail.example.dev/v1/gen/es-dni?count=5");
var response = HttpClient.newHttpClient()
    .send(HttpRequest.newBuilder(uri).build(), BodyHandlers.ofString());
```

---

## Using it in CI

The point of determinism is that failures are reproducible. Log the seed on every run:

```ts
const seed = process.env.TEST_SEED ?? crypto.randomUUID();
console.log(`test data seed: ${seed}`);

const { data } = generate({ kind: 'iban-es', seed, band: 'hostile', count: 100 });
```

When the build breaks, take the seed from the log and set `TEST_SEED` to replay the exact same data locally.

For anything you depend on, prefer the npm package over the hosted API. The service is best effort and free; the library runs offline, with no network latency and no availability risk.

---

## Catalogue

| Kind | Algorithm | Notes |
| --- | --- | --- |
| `es-dni` | mod 23 | DNI and NIE, per Royal Decree 1553/2005 |
| `email` | RFC 5322 | Quoted local parts, IP literals, unusual TLDs. Comments (CFWS) not supported |
| `domain-homograph` | Unicode script analysis | Takes a `target` parameter |
| `iban-es` | ISO 7064 mod 97 | Plus national CCC check digits |
| `iban-no` | ISO 7064 mod 97 | Plus national mod 11 check digit |
| `iban-nl` | ISO 7064 mod 97 | Plus elfproef |
| `iban-fr` | ISO 7064 mod 97 | Plus RIB key |
| `iban-be` | ISO 7064 mod 97 | Plus internal mod 97 |
| `iban-de`, `iban-gb`, `iban-it`, `iban-mt` | ISO 7064 mod 97 | No national check digit implemented |
| `card-visa`, `card-mastercard`, `card-amex`, `card-discover`, `card-jcb`, `card-diners` | Luhn | Documented test BIN ranges only |

Adding a kind requires no changes to the API. Every endpoint takes the kind as a parameter.

---

## Limitations

**National BBAN check digits are implemented for five of nine IBAN countries.** Spain, Norway, the Netherlands, France and Belgium are complete. Germany has no single national algorithm — each bank uses one of roughly a hundred methods published by the Bundesbank. The UK has no BBAN checksum; validation there relies on VocaLink modulus tables. Malta has none. Italy's CIN character is not yet implemented.

**Card numbers use documented test BIN ranges, never real issuer ranges.** They pass Luhn, but no bank has issued them and they cannot be used in a transaction.

**Seed derivation is not cryptographic.** It uses a fast non-cryptographic hash so the library can stay synchronous. This is correct for test data, which needs to be reproducible rather than unpredictable.

**Seeded responses are cached for a year.** Changing an existing generator is therefore a breaking change: someone who pinned a seed expects that value forever. New kinds are unaffected.

**Never use this for real credentials.** Do not generate blockchain wallets, private keys or production secrets with it. A key derived from a seed that travels in a URL is compromised by definition.

**Do not put personal data in seeds.** Seeds appear in URLs, and URLs appear in server logs.

---

## Development

```bash
pnpm install
pnpm vitest          # tests in watch mode
pnpm typecheck       # type checking across all packages
pnpm check           # format and lint

pnpm --filter @mocktail/api dev    # local API on :8787
```

### Adding a kind

Create a folder under `packages/core/src/kinds/` with a validator and a generator, then register it:

```ts
// packages/core/src/registry.ts
const kinds: readonly Kind[] = [esDni, email, domainHomograph, yourNewKind];
```

Write the validator first. It becomes the test oracle for the generator. `conformsToContract(yourKind)` then asserts, across thousands of seeds, that everything the generator produces passes the validator, that generation is deterministic, that `valid: false` produces values the validator rejects, and that the band actually affects the output.

If your kind needs user input, declare it in `params` with a `pattern` and a `maxLength`. Parameters are the only user input that reaches a generator, so they are validated in the contract rather than left to each kind to remember.

---

### Not yet covered

Personal names, dates with time zones, UUIDs and phone numbers. Names and
dates are the most requested and the most interesting: dates will be the
first kind to need range parameters rather than enumerable variants.

## License

Apache License 2.0. See `LICENSE` and `NOTICE`.

You are free to use, modify and redistribute this, including commercially. You must retain the copyright notice and state clearly which files you have changed.
