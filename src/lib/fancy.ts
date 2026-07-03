// Client-side fancy-text engine. Maps ASCII letters/digits to their Math
// Sans-Serif Unicode variants, or overlays a combining stroke. Pure string
// work — runs entirely in the browser, nothing is uploaded.

export type Style =
  | 'bold'
  | 'italic'
  | 'strike'
  | 'cursive'
  | 'wide'
  | 'bubble'
  | 'monospace'
  | 'underline';

// Codepoint bases for the first letter/digit of each Math Sans-Serif block.
const BOLD_UPPER = 0x1d5d4; // 𝗔
const BOLD_LOWER = 0x1d5ee; // 𝗮
const BOLD_DIGIT = 0x1d7ec; // 𝟬
const ITALIC_UPPER = 0x1d608; // 𝘈
const ITALIC_LOWER = 0x1d622; // 𝘢

// Mathematical Bold Script block (contiguous, complete — no reserved holes).
const CURSIVE_UPPER = 0x1d4d0; // 𝓐
const CURSIVE_LOWER = 0x1d4ea; // 𝓪

// Fullwidth Forms block.
const WIDE_UPPER = 0xff21; // Ａ
const WIDE_LOWER = 0xff41; // ａ
const WIDE_DIGIT = 0xff10; // ０
const WIDE_SPACE = 0x3000; //

// Enclosed Alphanumerics block.
const BUBBLE_UPPER = 0x24b6; // Ⓐ
const BUBBLE_LOWER = 0x24d0; // ⓐ
const BUBBLE_DIGIT = 0x2460; // ① (covers 1–9; 0 is special-cased)
const BUBBLE_ZERO = 0x24ea; // ⓪

// Mathematical Monospace block.
const MONO_UPPER = 0x1d670; // 𝙰
const MONO_LOWER = 0x1d68a; // 𝚊
const MONO_DIGIT = 0x1d7f6; // 𝟶

// Combining long stroke overlay, appended after each character.
const STRIKE = '̶';

// Combining low line overlay, appended after each character.
const UNDERLINE = '̲';

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
  if (style === 'underline') {
    return String.fromCodePoint(cp) + UNDERLINE;
  }

  if (style === 'wide') {
    if (cp === 0x20) return String.fromCodePoint(WIDE_SPACE);
    if (cp >= A && cp <= Z) return String.fromCodePoint(WIDE_UPPER + (cp - A));
    if (cp >= a && cp <= z) return String.fromCodePoint(WIDE_LOWER + (cp - a));
    if (cp >= ZERO && cp <= NINE) return String.fromCodePoint(WIDE_DIGIT + (cp - ZERO));
    return String.fromCodePoint(cp);
  }

  if (style === 'bubble') {
    if (cp >= A && cp <= Z) return String.fromCodePoint(BUBBLE_UPPER + (cp - A));
    if (cp >= a && cp <= z) return String.fromCodePoint(BUBBLE_LOWER + (cp - a));
    if (cp === ZERO) return String.fromCodePoint(BUBBLE_ZERO);
    if (cp > ZERO && cp <= NINE) return String.fromCodePoint(BUBBLE_DIGIT + (cp - ZERO - 1));
    return String.fromCodePoint(cp);
  }

  if (style === 'cursive') {
    if (cp >= A && cp <= Z) return String.fromCodePoint(CURSIVE_UPPER + (cp - A));
    if (cp >= a && cp <= z) return String.fromCodePoint(CURSIVE_LOWER + (cp - a));
    // No digit variants — left unchanged.
    return String.fromCodePoint(cp);
  }

  if (style === 'monospace') {
    if (cp >= A && cp <= Z) return String.fromCodePoint(MONO_UPPER + (cp - A));
    if (cp >= a && cp <= z) return String.fromCodePoint(MONO_LOWER + (cp - a));
    if (cp >= ZERO && cp <= NINE) return String.fromCodePoint(MONO_DIGIT + (cp - ZERO));
    return String.fromCodePoint(cp);
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
