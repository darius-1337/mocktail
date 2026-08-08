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
  readonly reason?: string;
}

const PUNYCODE_LABEL = /(^|\.)xn--/i;

export function detectConfusable(domain: string): ConfusableReport {
  const labels = domain.split('.');

  if (PUNYCODE_LABEL.test(domain)) {
    return {
      suspicious: true,
      severity: 'low',
      scripts: [],
      mixedLabels: [],
      punycode: true,
      reason: 'punycode form: decode to Unicode before analysing',
    };
  }
    const mixedLabels = labels.filter((l) => scriptsIn(l).length > 1);
    const scripts = scriptsIn(domain);

  if (mixedLabels.length > 0) {
    return {
      suspicious: true,
      severity: 'high',
      scripts,
      mixedLabels,
      punycode: false,
      reason: `mixed scripts within label(s): ${mixedLabels.join(', ')}`,
    };
  }

  if (scripts.length > 1) {
    return {
      suspicious: true,
      severity: 'medium',
      scripts,
      mixedLabels: [],
      punycode: false,
      reason: `domain mixes scripts across labels: ${scripts.join(', ')}`,
    };
  }

    return { suspicious: false, severity: 'none', scripts, mixedLabels: [], punycode: false };
}