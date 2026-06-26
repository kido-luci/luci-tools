// Client-side fancy-text engine. Maps ASCII letters/digits to their Math
// Sans-Serif Unicode variants, or overlays a combining stroke. Pure string
// work — runs entirely in the browser, nothing is uploaded.

export type Style = 'bold' | 'italic' | 'strike';

// Codepoint bases for the first letter/digit of each Math Sans-Serif block.
const BOLD_UPPER = 0x1d5d4; // 𝗔
const BOLD_LOWER = 0x1d5ee; // 𝗮
const BOLD_DIGIT = 0x1d7ec; // 𝟬
const ITALIC_UPPER = 0x1d608; // 𝘈
const ITALIC_LOWER = 0x1d622; // 𝘢

// Combining long stroke overlay, appended after each character.
const STRIKE = '̶';

const A = 0x41; // 'A'
const Z = 0x5a; // 'Z'
const a = 0x61; // 'a'
const z = 0x7a; // 'z'
const ZERO = 0x30; // '0'
const NINE = 0x39; // '9'

function mapChar(cp: number, style: Style): string {
  if (style === 'strike') {
    return String.fromCodePoint(cp) + STRIKE;
  }

  const upperBase = style === 'bold' ? BOLD_UPPER : ITALIC_UPPER;
  const lowerBase = style === 'bold' ? BOLD_LOWER : ITALIC_LOWER;

  if (cp >= A && cp <= Z) return String.fromCodePoint(upperBase + (cp - A));
  if (cp >= a && cp <= z) return String.fromCodePoint(lowerBase + (cp - a));

  // Italic has no digit variants — only bold maps digits.
  if (style === 'bold' && cp >= ZERO && cp <= NINE) {
    return String.fromCodePoint(BOLD_DIGIT + (cp - ZERO));
  }

  // Everything else (punctuation, spaces, symbols) is left unchanged.
  return String.fromCodePoint(cp);
}

export function styleText(input: string, style: Style): string {
  let out = '';
  // Iterate by characters (the spread handles surrogate pairs correctly).
  for (const ch of input) {
    out += mapChar(ch.codePointAt(0)!, style);
  }
  return out;
}
