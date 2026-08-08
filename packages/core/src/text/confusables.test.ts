import { describe, expect, it } from 'vitest';
import { detectConfusable, scriptsIn } from './confusables.js';

const CYR = { a: '\u0430', e: '\u0435', o: '\u043E', p: '\u0440', c: '\u0441', i: '\u0456' };

describe('scriptsIn', () => {
  it('ignores digits and punctuation', () => {
    expect(scriptsIn('abc123-def')).toEqual(['Latin']);
  });

  it('detects a single non-Latin script', () => {
    expect(scriptsIn('пример')).toEqual(['Cyrillic']);
  });

  it('detects both scripts when mixed', () => {
    expect([...scriptsIn(`${CYR.a}pple`)].sort()).toEqual(['Cyrillic', 'Latin']);
  });
});

describe('detectConfusable', () => {
  it.each(['apple.com', 'my-company.co.uk', 'example.org'])(
    'clears plain Latin domain %s',
    (d) => {
      expect(detectConfusable(d).severity).toBe('none');
    },
  );

  it('clears a legitimate single-script non-Latin domain', () => {
    const r = detectConfusable('пример.рф');
    expect(r.suspicious).toBe(false);
    expect(r.scripts).toEqual(['Cyrillic']);
  });

  it('flags mixing inside one label as high severity', () => {
    const r = detectConfusable(`${CYR.a}pple.com`);
    expect(r.severity).toBe('high');
    expect(r.mixedLabels).toHaveLength(1);
  });

  it('flags an all-Cyrillic label under a Latin TLD', () => {
    const attack = `${CYR.e}${CYR.p}${CYR.i}${CYR.c}.com`;
    const r = detectConfusable(attack);

    expect(r.suspicious).toBe(true);
    expect(r.severity).toBe('medium');
    expect(r.mixedLabels).toHaveLength(0);
    expect([...scriptsIn(`${CYR.a}pple`)].sort()).toEqual(['Cyrillic', 'Latin']);
  });

  it('warns that punycode must be decoded first', () => {
    const r = detectConfusable('xn--e1awd7f.com');
    expect(r.punycode).toBe(true);
    expect(r.severity).toBe('low');
    expect(r.reason).toMatch(/decode/i);
  });

  it('ranks label mixing above cross-label mixing', () => {
    const withinLabel = detectConfusable(`p${CYR.a}ypal.com`);
    const acrossLabels = detectConfusable(`${CYR.e}${CYR.p}${CYR.i}${CYR.c}.com`);
    expect(withinLabel.severity).toBe('high');
    expect(acrossLabels.severity).toBe('medium');
  });
});