# mocktail

Deterministic test data with a complexity dial, plus homograph attack detection for domains.

Generate identifiers that are **valid according to their real verification algorithm** — Luhn, ISO 7064 mod 97, mod 23, RFC 5322 — and choose how *unusual* they are within the space of legal values. Same seed in, same data out, every time.

Live at **https://mocktail.darius1337.workers.dev**. No installation, no API key, no account.

---

## Why

Production bugs do not show up with `test@example.com` and `John Smith`. They show up with:

- The surname `O'Brien-Müller` that breaks SQL escaping without parameterised queries.
- The Spanish DNI with leading zeros that someone stored as `INT`.
- The 19-digit card number that does not fit in `VARCHAR(16)`.
- The email `"very.(),:;<>[]\".unusual"@example.com`, valid per RFC 5322, that defeats almost every regex in production.
- The date `9999-12-31`, or `1970-01-01` meaning "nobody filled this in".
- The domain that looks exactly like yours but is written in Cyrillic.

mocktail gives you the strangest value that is still valid, and lets you reproduce it forever from a seed.

---

## Quick start

### Linux and macOS

```bash
curl "https://mocktail.darius1337.workers.dev/v1/gen/es-dni"
```

### Windows PowerShell

```powershell
irm "https://mocktail.darius1337.workers.dev/v1/gen/es-dni"
```

`irm` is `Invoke-RestMethod`, built into PowerShell. It parses the JSON for you.

### Windows CMD

If you prefer real curl on Windows, it is `curl.exe`, not `curl` — plain `curl` is an alias for a different command and will not accept `-s`:

```powershell
curl.exe -s "https://mocktail.darius1337.workers.dev/v1/gen/es-dni"
```

Note the quotes around the URL. On Windows they are required whenever the URL contains `&`, or the shell will cut the command in half.

Both return:

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

---

## Reading the response

Every generation endpoint returns the same shape.

| Field | What it is |
| --- | --- |
| `kind` | The kind that produced the values |
| `label` | Human-readable name |
| `seed` | The seed used. **Always returned**, even when the server picked it |
| `band` | The rarity band applied |
| `valid` | Whether values are meant to pass validation |
| `count` | How many values are in `data` |
| `params` | Parameters after defaults were applied |
| `data` | An **array of strings**, always, even for `count=1` |

The two fields that matter in practice are `data` and `seed`. `data` is what you came for; `seed` is what lets you get the exact same `data` again tomorrow.

### Getting just the values

By default curl prints the whole JSON on one line. Three ways to pull out what you need.

**With jq** (Linux, macOS, or `winget install jqlang.jq` on Windows):

```bash
# One value, no quotes, ready to pipe
curl -s "https://mocktail.darius1337.workers.dev/v1/gen/es-dni" | jq -r '.data[0]'
# 74568178Q

# Every value, one per line
curl -s "https://mocktail.darius1337.workers.dev/v1/gen/es-dni?count=5" | jq -r '.data[]'

# Straight into a file
curl -s "https://mocktail.darius1337.workers.dev/v1/gen/email?count=200&band=hostile" \
  | jq -r '.data[]' > emails.txt
```

**Without jq**, using Python, which is on most systems:

```bash
curl -s "https://mocktail.darius1337.workers.dev/v1/gen/es-dni?count=5" \
  | python3 -c "import sys,json; print(*json.load(sys.stdin)['data'], sep='\n')"
```

**On Windows PowerShell**, no extra tools needed:

```powershell
# One value
(irm "https://mocktail.darius1337.workers.dev/v1/gen/es-dni").data[0]

# Every value, one per line
(irm "https://mocktail.darius1337.workers.dev/v1/gen/es-dni?count=5").data

# Straight into a file
(irm "https://mocktail.darius1337.workers.dev/v1/gen/email?count=200&band=hostile").data |
  Set-Content emails.txt
```

### Keeping the seed

The seed is what makes a failing test reproducible. Capture it:

```bash
SEED=$(curl -s "https://mocktail.darius1337.workers.dev/v1/gen/es-dni?count=5" | jq -r '.seed')
echo "Reproduce with: /v1/gen/es-dni/$SEED?count=5"
```

```powershell
$r = irm "https://mocktail.darius1337.workers.dev/v1/gen/es-dni?count=5"
"Reproduce with: /v1/gen/es-dni/$($r.seed)?count=5"
```

Put that URL in a comment next to your test and anyone can regenerate the exact data that broke it.

---

## The three axes

These are independent. Mixing them up is the most common source of confusion.

| Axis | Controls | Values |
| --- | --- | --- |
| **Seed** | *Which* value you get | Any string up to 256 characters, or omitted for a random one |
| **Band** | *How unusual* it is | `simple`, `realistic`, `limit`, `hostile` |
| **Validity** | Whether it *passes* its algorithm | `valid=true` (default) or `valid=false` |

Changing the seed gives you a different value of the same character. Changing the band moves you along the strangeness spectrum. Changing validity is for testing that your validator correctly *rejects* things.

```bash
# Ordinary DNIs
curl -s ".../v1/gen/es-dni?band=simple&count=3" | jq -r '.data[]'
# 77111360L  85766643B  64964086B

# The ones that break parsers
curl -s ".../v1/gen/es-dni?band=hostile&count=3" | jq -r '.data[]'
# Z1799672L  00000000T  Y1653895W

# Values your validator should reject
curl -s ".../v1/gen/es-dni?valid=false&count=3" | jq -r '.data[]'
```

### A note on the band names

The band axis measures **rarity, not realism**. The least rare data is by definition the most lifelike, so `simple` produces the most realistic-looking values and `hostile` the least.

Bands are not hard boundaries. Each targets a zone of the spectrum and samples around it, so you get variety within a band rather than one fixed shape. Approximate distribution of generation strategies for IBAN:

| Band | Ordinary | Varied | Leading zeros | All zeros | All nines |
| --- | --- | --- | --- | --- | --- |
| `simple` | 78.9% | 20.8% | 0.3% | 0.0% | 0.0% |
| `realistic` | 4.6% | 65.9% | 28.7% | 0.8% | 0.1% |
| `limit` | 0.0% | 3.9% | 47.9% | 36.3% | 11.8% |
| `hostile` | 0.0% | 0.0% | 3.5% | 43.1% | 53.3% |

---

## Filling a table (WiP)

`/v1/populate` returns rows instead of a single column, in JSON, CSV or SQL.

```bash
curl -s -X POST "https://mocktail.darius1337.workers.dev/v1/populate" \
  -H "Content-Type: application/json" \
  -H "Accept: application/sql" \
  -d '{
    "seed": "dev-db",
    "count": 500,
    "band": "hostile",
    "table": "users",
    "fields": {
      "id": "uuid-v7",
      "dni": "es-dni",
      "email": "email",
      "phone": {"kind": "phone-es", "params": {"format": "national"}},
      "birth_date": {"kind": "date", "params": {"from": "1940-01-01", "to": "2006-12-31"}},
      "created_at": "datetime-sql",
      "age": {"kind": "integer", "min": 18, "max": 99},
      "active": {"kind": "boolean"}
    }
  }' > seed.sql
```

```bash
mysql mydb < seed.sql
```

Two commands and the table is populated. Ask for `text/csv` or `application/x-ndjson` instead if you prefer.

A field is either a kind id as a plain string, or an object with `kind` plus optional `band` and `params`. Primitives (`string`, `integer`, `number`, `boolean`, `enum`) cover the columns that are not identifiers.

**Adding a column does not change the others.** Each cell derives its own sub-seed from `seed:field:row`, so inserting a `phone` field leaves every existing value byte-identical. That is what makes the output usable as a fixture.

Limits: 10.000 rows, 50 fields, and 100.000 cells in total.

**What it does not do:** foreign keys, insert ordering, or coherence between fields. A generated `documentType` of `PASSPORT` may sit next to a DNI in `documentNumber`. Fields are independent by design; relational integrity is your schema's job.

---

## Security auditing: homograph attacks

A homograph attack registers a domain visually identical to a legitimate one, using characters from another alphabet. The Cyrillic `а` (U+0430) and the Latin `a` (U+0061) render identically in almost every font, but they are different characters, resolve to different domains, and can hold different TLS certificates.

mocktail **generates** these domains so you can test your defences, and **analyses** them so you can catch them.

```bash
curl -s -X POST "https://mocktail.darius1337.workers.dev/v1/analyze/domain" \
  -H "Content-Type: application/json" \
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
| `medium` | Labels internally consistent, but the domain mixes scripts across them. | `еріс.com`, an all-Cyrillic label under a Latin TLD |
| `high` | A single label mixes scripts. Almost never legitimate. | `pаypal.com` |

The distinction between `medium` and `high` matters. A legitimate Russian business may register `пример.com`, mixing a Cyrillic label with a Latin TLD. But mixing scripts *inside one word* has essentially no legitimate use — it exists to make a Cyrillic word look Latin.

Note that `пример.рф` is correctly cleared. A genuine non-Latin domain uses one script consistently; an attack mixes them, because the remaining characters must still resemble the original.

### Generating attack domains

Point it at any domain, including your own:

```bash
curl -s "https://mocktail.darius1337.workers.dev/v1/gen/domain-homograph?target=yourcompany.com&band=hostile&count=5" \
  | jq -r '.data[]'
```

Bands map to **detection difficulty**: `simple` swaps one character and is easy to catch, `hostile` swaps every character that has a look-alike.

### Not every brand is equally spoofable

A domain only becomes a fully Cyrillic label if *every* letter has a convincing look-alike. `apple.com` and `paypal.com` convert completely, so the strongest attack against them evades per-label detection and only registers as `medium`. `netflix.com` cannot: the `f` has no Cyrillic look-alike, so some Latin always remains and the attack stays visible at `high`.

If your own domain is fully convertible, that is worth knowing.

### Limitations of the detector

- **Punycode input.** `xn--e1awd7f.com` is pure ASCII, so script analysis finds nothing. The API reports `low` severity with a note; decode to Unicode before analysing. Decoding is not yet implemented.
- **Whole-script confusables.** A domain entirely in one non-Latin script, under a TLD of that same script, that still resembles a Latin brand.
- **Latin-only look-alikes.** `paypa1.com`, with a digit one instead of a letter `l`, mixes no scripts at all. Digits are `Script=Common` and are deliberately ignored.

Script analysis is one signal. It belongs alongside brand lists, certificate transparency monitoring and registration-date heuristics, not in place of them.

---

## API reference

Base URL: `https://mocktail.darius1337.workers.dev`

### GET /

Service metadata: available kinds, bands and example URLs.

### GET /v1/kinds

Full catalogue with descriptions, parameters and a live example for each kind.

```bash
curl -s "https://mocktail.darius1337.workers.dev/v1/kinds" | jq '.kinds[] | {id, example}'
```

The `example` field is generated on request from a fixed seed, so it can never drift out of sync with the generator.

### GET /v1/gen/:kind

| Parameter | In | Default | Description |
| --- | --- | --- | --- |
| `kind` | path | required | Kind id, e.g. `es-dni`, `iban-mt`, `card-visa` |
| `band` | query | `realistic` | `simple`, `realistic`, `limit`, `hostile` |
| `count` | query | `1` | Integer, 1 to 1000 |
| `valid` | query | `true` | `false` returns values that fail validation |

Any other query parameter is passed to the kind as a generation parameter. Check `/v1/kinds` for what each kind accepts. Malformed parameters return `400` with the expected format.

### GET /v1/gen/:kind/:seed

Same, with an explicit seed. Maximum 256 characters.

```bash
curl -s "https://mocktail.darius1337.workers.dev/v1/gen/iban-es/my-seed-123?count=3"
```

Responses carry `Cache-Control: public, max-age=86400, stale-while-revalidate=604800`, so repeated CI runs are served from the edge rather than recomputed.

### POST /v1/validate/:kind

```bash
curl -s -X POST "https://mocktail.darius1337.workers.dev/v1/validate/es-dni" \
  -H "Content-Type: application/json" \
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

Useful on its own: it tells you *why* a value fails, not just that it does.

### POST /v1/populate

See "Filling a table" above.

### POST /v1/analyze/domain

See the security section above.

### Errors

| Status | When |
| --- | --- |
| `400` | Invalid `band` or `count`, seed too long, malformed parameter or body, unsafe SQL table or column name |
| `404` | Unknown kind. The response lists every available id. |

Error bodies name the offending parameter and what was expected:

```json
{
  "error": "invalid parameter",
  "parameter": "from",
  "reason": "invalid_format",
  "received": "15/08/2026",
  "expected": "^\\d{4}-\\d{2}-\\d{2}$",
  "example": "2000-01-01"
}
```

Error messages contain the input you sent. Escape them before rendering in HTML.

---

## Using it from code

### JavaScript and TypeScript

Skip the network entirely:

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
if (report.suspicious) console.warn(report.reason);
```

Or call the API:

```ts
const res = await fetch('https://mocktail.darius1337.workers.dev/v1/gen/es-dni?count=5');
const { data, seed } = await res.json();
```

### Python

```python
import requests

r = requests.get(
    "https://mocktail.darius1337.workers.dev/v1/gen/iban-es",
    params={"band": "hostile", "count": 10},
)
payload = r.json()
print(payload["data"], payload["seed"])
```

### Java

```java
var uri = URI.create(
    "https://mocktail.darius1337.workers.dev/v1/gen/es-dni?count=5&band=hostile");

var body = HttpClient.newHttpClient()
    .send(HttpRequest.newBuilder(uri).build(), BodyHandlers.ofString())
    .body();

List<String> values = new ObjectMapper()
    .readTree(body).get("data")
    .findValuesAsText("");
```

For Spring Boot, the simplest route needs no Java at all: generate a `data.sql` with `/v1/populate` and drop it in `src/main/resources/`. Spring runs it on startup.

### In CI

Log the seed on every run so failures stay reproducible:

```ts
const seed = process.env.TEST_SEED ?? crypto.randomUUID();
console.log(`test data seed: ${seed}`);

const { data } = generate({ kind: 'iban-es', seed, band: 'hostile', count: 100 });
```

When the build breaks, set `TEST_SEED` to that value and replay the exact same data locally.

For anything you depend on, prefer the npm package over the hosted API. The service is free and best effort; the library runs offline with no latency and no availability risk.

---

## Catalogue

26 kinds. `GET /v1/kinds` returns the live list with a working example for each.

| Kind | Algorithm | Notes |
| --- | --- | --- |
| `es-dni` | mod 23 | DNI and NIE, per Royal Decree 1553/2005 |
| `email` | RFC 5322 | Quoted local parts, IP literals, unusual TLDs. Comments (CFWS) not supported |
| `uuid-v4`, `uuid-v7` | RFC 9562 | Version and variant bits; v7 sorts by creation time |
| `date` | Calendar | Leap years, month boundaries, epoch, 2038, year 9999. Takes `from` and `to` |
| `datetime` | ISO 8601 | With UTC offset, including `+05:45`. Leap seconds accepted |
| `datetime-sql` | SQL DATETIME | Space separator, no offset, for database columns |
| `phone-us`, `phone-gb`, `phone-es` | E.164 | Reserved fictitious ranges only. Takes `format` |
| `iban-es`, `iban-no`, `iban-nl`, `iban-fr`, `iban-be` | ISO 7064 mod 97 | Plus national BBAN check digits |
| `iban-de`, `iban-gb`, `iban-it`, `iban-mt` | ISO 7064 mod 97 | No national check digit implemented |
| `card-visa`, `card-mastercard`, `card-amex`, `card-discover`, `card-jcb`, `card-diners` | Luhn | Documented test BIN ranges only |
| `domain-homograph` | Unicode script analysis | Takes a `target` parameter |

Adding a kind requires no changes to the API. Every endpoint takes the kind as a parameter.

### Not yet covered

Person names, postal codes, URLs, IMEI and Spanish CIF. Names are the most interesting of these: apostrophes, the Turkish dotless i, right-to-left scripts and mononyms break more software than any checksum.

---

## Limitations

**Phone numbers use ranges that cannot reach a real subscriber.** US numbers use the NANPA 555-0100 to 555-0199 fictitious range and UK numbers the Ofcom drama blocks — both are regulatory reservations. Spanish numbers use the unallocated 99 range, which is a **technical convention, not a regulatory reservation**: strict validators will reject them as not assignable in ES. That is deliberate, so the number cannot belong to anyone.

**National BBAN check digits cover five of nine IBAN countries.** Germany has no single national algorithm — each bank uses one of roughly a hundred methods published by the Bundesbank. The UK has no BBAN checksum; validation relies on VocaLink modulus tables. Malta has none. Italy's CIN character is not yet implemented.

**Card numbers use documented test BIN ranges, never real issuer ranges.** They pass Luhn, but no bank has issued them and they cannot be used in a transaction.

**Seed derivation is not cryptographic.** It uses a fast non-cryptographic hash so the library stays synchronous. That is correct for test data, which needs to be reproducible rather than unpredictable.

**Seeded responses are cached for a day.** Changing an existing generator is still a breaking change for anyone who pinned a seed, but a fix now propagates within 24 hours instead of being frozen for a year.

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

Create a folder under `packages/core/src/kinds/` with a validator and a generator, then register it in `packages/core/src/registry.ts`.

Write the validator first. It becomes the test oracle for the generator: `conformsToContract(yourKind)` then asserts, across thousands of seeds, that everything the generator produces passes the validator, that generation is deterministic, that `valid: false` produces values the validator rejects, and that the band actually affects the output.

If your kind needs user input, declare it in `params` with a `pattern` and a `maxLength`. Parameters are the only user input that reaches a generator, so they are validated in the contract rather than left to each kind to remember.

One rule worth keeping: a parameter may change **which value** comes out (a range, a country, a card brand). If it would change **what counts as valid**, it is a separate kind. That is why `datetime` and `datetime-sql` are two kinds rather than one with a format switch.

---

## License

Apache License 2.0. See `LICENSE` and `NOTICE`.

You are free to use, modify and redistribute this, including commercially. You must retain the copyright notice and state clearly which files you have changed.
