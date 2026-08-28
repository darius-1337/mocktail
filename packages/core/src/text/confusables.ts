import { hasPunycode, punycodeToUnicode } from "./punycode.js";

const SCRIPT_PATTERNS = {
  Latin: /\p{Script=Latin}/u,
  Cyrillic: /\p{Script=Cyrillic}/u,
  Greek: /\p{Script=Greek}/u,
  Han: /\p{Script=Han}/u,
  Arabic: /\p{Script=Arabic}/u,
  Hebrew: /\p{Script=Hebrew}/u,
  Hangul: /\p{Script=Hangul}/u,
} as const;

export type ScriptName = keyof typeof SCRIPT_PATTERNS;

const NEUTRAL = /[\p{Script=Common}\p{Script=Inherited}]/u;
const SCRIPT_ENTRIES = Object.entries(SCRIPT_PATTERNS) as [ScriptName, RegExp][];

export function scriptsIn(text: string): readonly ScriptName[] {
  const found = new Set<ScriptName>();
  for (const ch of text) {
    if (NEUTRAL.test(ch)) continue;
    for (const [name, pattern] of SCRIPT_ENTRIES) {
      if (pattern.test(ch)) {
        found.add(name);
        break;
      }
    }
  }
  return [...found];
}

export type ConfusableSeverity = 'none' | 'low' | 'medium' | 'high';

export interface ConfusableReport {
  readonly suspicious: boolean;
  readonly severity: ConfusableSeverity;
  readonly scripts: readonly ScriptName[];
  readonly mixedLabels: readonly string[];
  readonly punycode: boolean;
  readonly decoded?: string;
  readonly reason?: string;
}

export function detectConfusable(domain: string): ConfusableReport {
  const punycode = hasPunycode(domain);
  const analysed = punycode ? punycodeToUnicode(domain) : domain;

  const labels = analysed.split('.');
  const mixedLabels = labels.filter((l) => scriptsIn(l).length > 1);
  const scripts = scriptsIn(analysed);

  const base = {
    punycode,
    scripts,
    ...(punycode ? { decoded: analysed } : {}),
  };

  if (mixedLabels.length > 0) {
    return {
      ...base,
      suspicious: true,
      severity: 'high',
      mixedLabels,
      reason: `mixed scripts within label(s): ${mixedLabels.join(', ')}`,
    };
  }

  if (scripts.length > 1) {
    return {
      ...base,
      suspicious: true,
      severity: 'medium',
      scripts,
      mixedLabels: [],
      reason: `domain mixes scripts across labels: ${scripts.join(', ')}`,
    };
  }

    return { ...base, suspicious: false, severity: 'none', mixedLabels: [] };
}