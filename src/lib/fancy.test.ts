import { describe, it, expect } from 'vitest';
import { styleText } from './fancy';

describe('styleText — bold', () => {
  it('maps uppercase letters to Math Sans-Serif Bold', () => {
    const result = styleText('Hi', 'bold');
    // 'H' → BOLD_UPPER + 7 = 0x1D5D4 + 7 = 0x1D5DB
    expect(result.codePointAt(0)).toBe(0x1d5db);
  });

  it('maps A to 0x1D5D4', () => {
    expect(styleText('A', 'bold').codePointAt(0)).toBe(0x1d5d4);
  });

  it('maps digits to Math Sans-Serif Bold digits', () => {
    // '0' → BOLD_DIGIT = 0x1D7EC
    expect(styleText('0', 'bold').codePointAt(0)).toBe(0x1d7ec);
  });

  it('leaves spaces unchanged', () => {
    const result = styleText('a b!', 'bold');
    // Split into individual chars by spread to handle surrogate pairs
    const chars = [...result];
    // space stays space, '!' stays '!'
    expect(chars.some((c) => c === ' ')).toBe(true);
    expect(chars.some((c) => c === '!')).toBe(true);
  });

  it('returns empty string for empty input', () => {
    expect(styleText('', 'bold')).toBe('');
  });
});

describe('styleText — italic', () => {
  it('maps uppercase letters to Math Sans-Serif Italic', () => {
    // 'H' → ITALIC_UPPER + 7 = 0x1D608 + 7 = 0x1D60F
    expect(styleText('H', 'italic').codePointAt(0)).toBe(0x1d60f);
  });

  it('leaves digits unchanged (italic has no digit variants)', () => {
    expect(styleText('5', 'italic')).toBe('5');
  });

  it('returns empty string for empty input', () => {
    expect(styleText('', 'italic')).toBe('');
  });
});

describe('styleText — strike', () => {
  it('appends combining long stroke overlay after each character', () => {
    const result = styleText('Hi', 'strike');
    // Each character gets the combining stroke appended → "H̶i̶"
    expect(result).toBe('H̶i̶');
  });

  it('returns empty string for empty input', () => {
    expect(styleText('', 'strike')).toBe('');
  });
});
