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

  it('boundary: Z maps to 0x1D5ED', () => {
    expect(styleText('Z', 'bold').codePointAt(0)).toBe(0x1d5ed);
  });

  it('boundary: a maps to 0x1D5EE', () => {
    expect(styleText('a', 'bold').codePointAt(0)).toBe(0x1d5ee);
  });

  it('boundary: z maps to 0x1D607', () => {
    expect(styleText('z', 'bold').codePointAt(0)).toBe(0x1d607);
  });

  it('boundary: 9 maps to 0x1D7F5', () => {
    expect(styleText('9', 'bold').codePointAt(0)).toBe(0x1d7f5);
  });

  it('full A–Z bold mapping matches offset from base', () => {
    const BOLD_UPPER = 0x1d5d4;
    for (let i = 0; i < 26; i++) {
      const ch = String.fromCharCode(0x41 + i); // 'A' + i
      expect(styleText(ch, 'bold').codePointAt(0)).toBe(BOLD_UPPER + i);
    }
  });

  it('leaves non-alphanumerics unchanged: space, !, @, -, .', () => {
    for (const ch of [' ', '!', '@', '-', '.']) {
      expect(styleText(ch, 'bold')).toBe(ch);
    }
  });

  it('passes through unicode character é unchanged', () => {
    expect(styleText('é', 'bold')).toBe('é');
  });

  it('passes through emoji 😀 unchanged', () => {
    expect(styleText('😀', 'bold')).toBe('😀');
  });

  it('preserves multiline input', () => {
    const result = styleText('A\nB', 'bold');
    const chars = [...result];
    expect(chars[1]).toBe('\n');
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

  it('boundary: A maps to 0x1D608', () => {
    expect(styleText('A', 'italic').codePointAt(0)).toBe(0x1d608);
  });

  it('boundary: Z maps to 0x1D621', () => {
    expect(styleText('Z', 'italic').codePointAt(0)).toBe(0x1d621);
  });

  it('boundary: a maps to 0x1D622', () => {
    expect(styleText('a', 'italic').codePointAt(0)).toBe(0x1d622);
  });

  it('boundary: z maps to 0x1D63B', () => {
    expect(styleText('z', 'italic').codePointAt(0)).toBe(0x1d63b);
  });

  it('all digits 0–9 are unchanged for italic', () => {
    for (let d = 0; d <= 9; d++) {
      const ch = String(d);
      expect(styleText(ch, 'italic')).toBe(ch);
    }
  });

  it('leaves non-alphanumerics unchanged: space, !, @, -, .', () => {
    for (const ch of [' ', '!', '@', '-', '.']) {
      expect(styleText(ch, 'italic')).toBe(ch);
    }
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

  it('applies strike to space and punctuation: "a b"', () => {
    expect(styleText('a b', 'strike')).toBe('a̶ ̶b̶');
  });

  it('applies strike to every character including punctuation', () => {
    const COMBINING_STROKE = '̶';
    const input = 'a b';
    const result = styleText(input, 'strike');
    // Result should have each char of input followed by the combining stroke
    const expected = [...input].map((ch) => ch + COMBINING_STROKE).join('');
    expect(result).toBe(expected);
  });
});
