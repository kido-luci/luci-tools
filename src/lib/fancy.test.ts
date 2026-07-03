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

describe('styleText — cursive', () => {
  it('maps A to Mathematical Bold Script 𝓐 (0x1D4D0)', () => {
    expect(styleText('A', 'cursive').codePointAt(0)).toBe(0x1d4d0);
  });

  it('maps a to Mathematical Bold Script 𝓪 (0x1D4EA)', () => {
    expect(styleText('a', 'cursive').codePointAt(0)).toBe(0x1d4ea);
  });

  it('maps "Ab1" to 𝓐𝓫1 (digits unchanged)', () => {
    expect(styleText('Ab1', 'cursive')).toBe('𝓐𝓫1');
  });

  it('boundary: Z maps to 0x1D4E9', () => {
    expect(styleText('Z', 'cursive').codePointAt(0)).toBe(0x1d4e9);
  });

  it('boundary: z maps to 0x1D503', () => {
    expect(styleText('z', 'cursive').codePointAt(0)).toBe(0x1d503);
  });

  it('leaves digits and punctuation unchanged', () => {
    expect(styleText('0-9!', 'cursive')).toBe('0-9!');
  });

  it('returns empty string for empty input', () => {
    expect(styleText('', 'cursive')).toBe('');
  });
});

describe('styleText — wide', () => {
  it('maps A to Fullwidth Ａ (0xFF21)', () => {
    expect(styleText('A', 'wide').codePointAt(0)).toBe(0xff21);
  });

  it('maps a to Fullwidth ａ (0xFF41)', () => {
    expect(styleText('a', 'wide').codePointAt(0)).toBe(0xff41);
  });

  it('maps 0 to Fullwidth ０ (0xFF10)', () => {
    expect(styleText('0', 'wide').codePointAt(0)).toBe(0xff10);
  });

  it('maps ASCII space to ideographic space (0x3000)', () => {
    expect(styleText(' ', 'wide').codePointAt(0)).toBe(0x3000);
  });

  it('"A z 0" fully maps to fullwidth incl. ideographic space', () => {
    expect(styleText('A z 0', 'wide')).toBe('Ａ　ｚ　０');
  });

  it('returns empty string for empty input', () => {
    expect(styleText('', 'wide')).toBe('');
  });
});

describe('styleText — bubble', () => {
  it('maps A to Ⓐ (0x24B6)', () => {
    expect(styleText('A', 'bubble').codePointAt(0)).toBe(0x24b6);
  });

  it('maps a to ⓐ (0x24D0)', () => {
    expect(styleText('a', 'bubble').codePointAt(0)).toBe(0x24d0);
  });

  it('maps 1 to ① (0x2460)', () => {
    expect(styleText('1', 'bubble').codePointAt(0)).toBe(0x2460);
  });

  it('maps 0 to ⓪ (0x24EA, special-cased)', () => {
    expect(styleText('0', 'bubble').codePointAt(0)).toBe(0x24ea);
  });

  it('"Ab1" maps to Ⓐⓑ①', () => {
    expect(styleText('Ab1', 'bubble')).toBe('Ⓐⓑ①');
  });

  it('leaves punctuation and spaces unchanged', () => {
    expect(styleText(' !', 'bubble')).toBe(' !');
  });

  it('returns empty string for empty input', () => {
    expect(styleText('', 'bubble')).toBe('');
  });
});

describe('styleText — monospace', () => {
  it('maps A to Mathematical Monospace 𝙰 (0x1D670)', () => {
    expect(styleText('A', 'monospace').codePointAt(0)).toBe(0x1d670);
  });

  it('maps a to Mathematical Monospace 𝚊 (0x1D68A)', () => {
    expect(styleText('a', 'monospace').codePointAt(0)).toBe(0x1d68a);
  });

  it('maps 0 to Mathematical Monospace 𝟶 (0x1D7F6)', () => {
    expect(styleText('0', 'monospace').codePointAt(0)).toBe(0x1d7f6);
  });

  it('"A" maps to 𝙰', () => {
    expect(styleText('A', 'monospace')).toBe('𝙰');
  });

  it('leaves punctuation and spaces unchanged', () => {
    expect(styleText(' !', 'monospace')).toBe(' !');
  });

  it('returns empty string for empty input', () => {
    expect(styleText('', 'monospace')).toBe('');
  });
});

describe('styleText — underline', () => {
  it('appends combining low line overlay after each character', () => {
    const result = styleText('Hi', 'underline');
    // Each character gets the combining low line appended → "H̲i̲"
    expect(result).toBe('H̲i̲');
  });

  it('returns empty string for empty input', () => {
    expect(styleText('', 'underline')).toBe('');
  });

  it('applies underline to space and punctuation: "a b"', () => {
    expect(styleText('a b', 'underline')).toBe('a̲ ̲b̲');
  });

  it('applies underline to every character matching combining mark', () => {
    const COMBINING_LOW_LINE = '̲';
    const input = 'a b';
    const result = styleText(input, 'underline');
    const expected = [...input].map((ch) => ch + COMBINING_LOW_LINE).join('');
    expect(result).toBe(expected);
  });
});
