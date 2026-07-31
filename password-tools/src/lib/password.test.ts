// Unit tests for the pure engine in password.ts. `generatePassword` and
// `generatePassphrase` accept an injected rng so tests never rely on
// crypto/Math.random — deterministic input, deterministic assertions.

import { describe, it, expect } from 'vitest';
import { generatePassword, generatePassphrase, estimateStrength, WORDLIST } from './password';

// Deterministic PRNG (mulberry32) so tests are reproducible without crypto.
function makeRng(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('generatePassword', () => {
  it('returns a string of exactly the requested length', () => {
    const rng = makeRng(1);
    const pw = generatePassword({ length: 16, upper: true, lower: true, digits: true, symbols: true }, rng);
    expect(pw).toHaveLength(16);
  });

  it('returns empty string for length 0', () => {
    const rng = makeRng(1);
    const pw = generatePassword({ length: 0, upper: true, lower: true, digits: true, symbols: true }, rng);
    expect(pw).toBe('');
  });

  it('only contains characters from enabled classes (lower + digits only)', () => {
    const rng = makeRng(2);
    const pw = generatePassword({ length: 40, upper: false, lower: true, digits: true, symbols: false }, rng);
    expect(pw).toMatch(/^[a-z0-9]+$/);
  });

  it('excludes symbols when symbols is disabled', () => {
    const rng = makeRng(3);
    const pw = generatePassword({ length: 40, upper: true, lower: true, digits: true, symbols: false }, rng);
    expect(pw).not.toMatch(/[!@#$%^&*()\-_=+[\]{};:,.<>?]/);
  });

  it('excludes uppercase when upper is disabled', () => {
    const rng = makeRng(4);
    const pw = generatePassword({ length: 40, upper: false, lower: true, digits: true, symbols: true }, rng);
    expect(pw).not.toMatch(/[A-Z]/);
  });

  it('excludes digits when digits is disabled', () => {
    const rng = makeRng(5);
    const pw = generatePassword({ length: 40, upper: true, lower: true, digits: false, symbols: true }, rng);
    expect(pw).not.toMatch(/[0-9]/);
  });

  it('excludes lowercase when lower is disabled', () => {
    const rng = makeRng(6);
    const pw = generatePassword({ length: 40, upper: true, lower: false, digits: true, symbols: true }, rng);
    expect(pw).not.toMatch(/[a-z]/);
  });

  it('includes at least one char from each enabled class when length allows', () => {
    const rng = makeRng(7);
    const pw = generatePassword({ length: 24, upper: true, lower: true, digits: true, symbols: true }, rng);
    expect(pw).toMatch(/[A-Z]/);
    expect(pw).toMatch(/[a-z]/);
    expect(pw).toMatch(/[0-9]/);
    expect(pw).toMatch(/[!@#$%^&*()\-_=+[\]{};:,.<>?]/);
  });

  it('falls back to a usable charset when no class is enabled', () => {
    const rng = makeRng(8);
    const pw = generatePassword({ length: 10, upper: false, lower: false, digits: false, symbols: false }, rng);
    expect(pw).toHaveLength(10);
    expect(pw).toMatch(/^[a-z]+$/);
  });

  it('is deterministic for the same injected rng seed', () => {
    const opts = { length: 20, upper: true, lower: true, digits: true, symbols: true };
    const a = generatePassword(opts, makeRng(42));
    const b = generatePassword(opts, makeRng(42));
    expect(a).toBe(b);
  });
});

describe('generatePassphrase', () => {
  it('produces the requested word count separated by the default separator', () => {
    const rng = makeRng(1);
    const phrase = generatePassphrase(5, rng);
    expect(phrase.split('-')).toHaveLength(5);
  });

  it('uses a custom separator', () => {
    const rng = makeRng(2);
    const phrase = generatePassphrase(4, rng, '_');
    expect(phrase.split('_')).toHaveLength(4);
    expect(phrase).not.toContain('-');
  });

  it('returns empty string for word count 0', () => {
    const rng = makeRng(1);
    expect(generatePassphrase(0, rng)).toBe('');
  });

  it('only uses words from the embedded wordlist', () => {
    const rng = makeRng(3);
    const phrase = generatePassphrase(10, rng);
    for (const word of phrase.split('-')) {
      expect(WORDLIST).toContain(word);
    }
  });

  it('is deterministic for the same injected rng seed', () => {
    const a = generatePassphrase(6, makeRng(99));
    const b = generatePassphrase(6, makeRng(99));
    expect(a).toBe(b);
  });
});

describe('estimateStrength', () => {
  it('returns weak with 0 bits for an empty string', () => {
    expect(estimateStrength('')).toEqual({ bits: 0, label: 'weak' });
  });

  it('increases bits as length increases (same charset)', () => {
    const short = estimateStrength('abcd');
    const long = estimateStrength('abcdefgh');
    expect(long.bits).toBeGreaterThan(short.bits);
  });

  it('increases bits as more character classes are present', () => {
    const lowerOnly = estimateStrength('abcdefgh');
    const mixed = estimateStrength('aBcdEFgh');
    const mixedWithDigitsSymbols = estimateStrength('aB3d!Fg#');
    expect(mixed.bits).toBeGreaterThan(lowerOnly.bits);
    expect(mixedWithDigitsSymbols.bits).toBeGreaterThan(mixed.bits);
  });

  it('label is monotone with bits across thresholds', () => {
    const order: Record<string, number> = { weak: 0, fair: 1, good: 2, strong: 3 };
    const weak = estimateStrength('ab');
    const fair = estimateStrength('abcdefghij');
    const good = estimateStrength('aB3d!Fg#xQ2z');
    const strong = estimateStrength('aB3d!Fg#xQ2zR7y$wP9mLk@2');

    expect(order[weak.label]).toBeLessThanOrEqual(order[fair.label]);
    expect(order[fair.label]).toBeLessThanOrEqual(order[good.label]);
    expect(order[good.label]).toBeLessThanOrEqual(order[strong.label]);
  });

  it('labels a short lowercase-only password as weak', () => {
    expect(estimateStrength('abc').label).toBe('weak');
  });

  it('labels a long, mixed-class password as strong', () => {
    expect(estimateStrength('aB3d!Fg#xQ2zR7y$wP9mLk@2vN6t').label).toBe('strong');
  });
});
