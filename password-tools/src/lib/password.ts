// Client-side password & passphrase generation engine. Runs entirely in the
// browser: no network calls, no server round-trip. Every function accepts an
// optional `rng` (0..1 uniform source) so tests can inject a deterministic
// generator instead of relying on crypto.

/** Uniform random source in [0, 1). Defaults to crypto in the browser. */
export type Rng = () => number;

/* v8 ignore start -- browser-only (crypto.getRandomValues), never called in
   tests since every test injects a deterministic rng instead */
function cryptoRng(): number {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return arr[0] / 4294967296; // 2^32
}

/** Default rng: crypto-backed in the browser, Math.random as a last resort. */
function defaultRng(): number {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    return cryptoRng();
  }
  return Math.random();
}
/* v8 ignore stop */

/** Pick a random integer in [0, max) using the given rng. */
function randomInt(max: number, rng: Rng): number {
  return Math.floor(rng() * max);
}

/** Pick a random element from a non-empty array. */
function pick<T>(arr: readonly T[], rng: Rng): T {
  return arr[randomInt(arr.length, rng)];
}

/** Pick a random character from a non-empty string. */
function pickChar(str: string, rng: Rng): string {
  return str[randomInt(str.length, rng)];
}

/** Fisher-Yates shuffle, in place, using the given rng. */
function shuffle<T>(arr: T[], rng: Rng): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(i + 1, rng);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const CHAR_CLASSES = {
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lower: 'abcdefghijklmnopqrstuvwxyz',
  digits: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.<>?',
} as const;

export interface GeneratePasswordOptions {
  length: number;
  upper: boolean;
  lower: boolean;
  digits: boolean;
  symbols: boolean;
}

/**
 * Generate a random password from the enabled character classes. Guarantees
 * at least one character from each enabled class when `length` allows it.
 * Falls back to the lowercase set if no class is enabled (so the function
 * always returns a usable string rather than throwing).
 */
export function generatePassword(opts: GeneratePasswordOptions, rng: Rng = defaultRng): string {
  const { length } = opts;
  const enabledClasses = (Object.keys(CHAR_CLASSES) as (keyof typeof CHAR_CLASSES)[]).filter(
    (key) => opts[key],
  );

  const classes = enabledClasses.length > 0 ? enabledClasses : (['lower'] as const);
  const charset = classes.map((c) => CHAR_CLASSES[c]).join('');

  if (length <= 0) return '';

  const result: string[] = [];

  // Guarantee at least one char from each enabled class, up to `length`.
  for (const cls of classes) {
    if (result.length >= length) break;
    result.push(pickChar(CHAR_CLASSES[cls], rng));
  }

  while (result.length < length) {
    result.push(pickChar(charset, rng));
  }

  return shuffle(result, rng).join('');
}

// ~150 common short English words for passphrase generation. Kept lowercase,
// no ambiguous punctuation — embedded so generation needs no network fetch.
export const WORDLIST: readonly string[] = [
  'apple', 'ash', 'bay', 'bear', 'bell', 'bird', 'blue', 'boat', 'bold', 'bolt',
  'bone', 'book', 'boot', 'brave', 'bread', 'brick', 'bright', 'brook', 'brush', 'cabin',
  'cake', 'calm', 'camp', 'candy', 'cave', 'chair', 'chalk', 'charm', 'chase', 'cheese',
  'chess', 'chief', 'child', 'clay', 'cliff', 'cloud', 'clover', 'coal', 'coast', 'coin',
  'cold', 'comet', 'coral', 'crane', 'creek', 'crisp', 'crown', 'curve', 'dance', 'dawn',
  'deep', 'deer', 'desk', 'dew', 'diamond', 'dirt', 'dog', 'dove', 'dragon', 'drift',
  'drum', 'dust', 'eagle', 'earth', 'echo', 'elm', 'ember', 'fable', 'falcon', 'fast',
  'fawn', 'feast', 'fern', 'field', 'fire', 'fish', 'flame', 'flow', 'flower', 'fog',
  'forest', 'fox', 'frost', 'fruit', 'garden', 'gate', 'ghost', 'glow', 'gold', 'grain',
  'grape', 'grass', 'gray', 'green', 'grove', 'hall', 'harbor', 'hare', 'harp', 'haven',
  'hawk', 'hazel', 'heart', 'hill', 'honey', 'horn', 'horse', 'ice', 'iris', 'ivy',
  'jade', 'jazz', 'jewel', 'joy', 'kelp', 'kind', 'kite', 'lake', 'lamp', 'leaf',
  'lemon', 'light', 'lily', 'lime', 'lion', 'lotus', 'luck', 'lunar', 'lyric', 'maple',
  'marsh', 'meadow', 'melon', 'mint', 'mist', 'moon', 'moss', 'moth', 'mount', 'music',
  'night', 'oak', 'ocean', 'olive', 'onyx', 'opal', 'orbit', 'otter', 'owl', 'panda',
  'peach', 'pearl', 'pebble', 'petal', 'pine', 'plum', 'pond', 'poppy', 'quartz', 'quiet',
  'rain', 'raven', 'reed', 'reef', 'river', 'robin', 'rock', 'rose', 'sage', 'sail',
  'sand', 'shade', 'shell', 'shore', 'sky', 'snow', 'song', 'spark', 'star', 'stone',
  'storm', 'stream', 'sun', 'swan', 'tide', 'tiger', 'toast', 'trail', 'tree', 'tulip',
  'valley', 'violet', 'wave', 'wheat', 'willow', 'wind', 'wolf', 'wood', 'wren', 'zephyr',
] as const;

/**
 * Generate a passphrase of `wordCount` words picked from the embedded
 * wordlist, joined by `separator`. Deterministic when `rng` is injected.
 */
export function generatePassphrase(
  wordCount: number,
  rng: Rng = defaultRng,
  separator = '-',
): string {
  if (wordCount <= 0) return '';
  const words: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    words.push(pick(WORDLIST, rng));
  }
  return words.join(separator);
}

export type StrengthLabel = 'weak' | 'fair' | 'good' | 'strong';

export interface StrengthEstimate {
  bits: number;
  label: StrengthLabel;
}

/**
 * Estimate password entropy in bits as length × log2(charset size present),
 * using the widest character-class assumption detectable from the string's
 * contents. Labeled by common bit thresholds.
 */
export function estimateStrength(pw: string): StrengthEstimate {
  if (pw.length === 0) return { bits: 0, label: 'weak' };

  let charsetSize = 0;
  if (/[a-z]/.test(pw)) charsetSize += 26;
  if (/[A-Z]/.test(pw)) charsetSize += 26;
  if (/[0-9]/.test(pw)) charsetSize += 10;
  if (/[^a-zA-Z0-9]/.test(pw)) charsetSize += 33;
  if (charsetSize === 0) charsetSize = 1;

  const bits = pw.length * Math.log2(charsetSize);

  let label: StrengthLabel;
  if (bits < 28) label = 'weak';
  else if (bits < 60) label = 'fair';
  else if (bits < 100) label = 'good';
  else label = 'strong';

  return { bits, label };
}
