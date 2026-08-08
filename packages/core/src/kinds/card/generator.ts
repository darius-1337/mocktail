import type { GeneratedOptions } from "../../contracts";
import { BAND_TARGET } from "../../contracts";
import { selectByRarity, type Weighted } from "../../entropy/select";
import type { Rng } from "../../rng/splitmix64";
import { BRANDS, luhnCheckDigit, type Brand } from "./validator";

type Format = (pan: string) => string;

interface Strategy extends Weighted {
    readonly preferShort: boolean;
    readonly format: Format;
}

const plain: Format = (pan) => pan;

const spacedNumbers: Format = (pan) =>
    pan.length === 15
        ? `${pan.slice(0, 4)} ${pan.slice(4, 10)} ${pan.slice(10)}`
        : (pan.match(/.{1,4}/g) ?? [pan]).join(' ');

const dashedNumbers: Format = (pan) => (pan.match(/.{1,4}/g) ?? [pan]).join('-');

const STRATEGIES: readonly [Strategy, ...Strategy[]] = [
    { rarity: 0.05, preferShort: true, format: plain },
  { rarity: 0.35, preferShort: true, format: plain },
  { rarity: 0.6, preferShort: true, format: spacedNumbers },
  { rarity: 0.85, preferShort: false, format: spacedNumbers },
  { rarity: 0.97, preferShort: false, format: dashedNumbers },
];

export function generateCard(brand: Brand, rng: Rng, options: GeneratedOptions): string {
    const strategy = selectByRarity(rng, STRATEGIES, BAND_TARGET[options.band]);
    const spec = BRANDS[brand];

    const prefixes = spec.prefixes;
    const prefix = prefixes[rng.int(prefixes.length)] ?? prefixes[0];

    const lengths = spec.lengths;
    const length = strategy.preferShort
        ? (lengths[0] ?? 16)
        : (lengths[lengths.length - 1] ?? lengths[0] ?? 16);
    
    let body = prefix;
    while(body.length < length - 1) body += rng.int(10);

    const pan = options.valid === false
        ? body + String((Number(luhnCheckDigit(body)) + 1) % 10)
        : body + luhnCheckDigit(body);

    return options.valid === false ? pan : strategy.format(pan);
}