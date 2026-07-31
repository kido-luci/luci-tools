// Hashing engine. SHA-1/256/384/512 delegate to the browser's native
// SubtleCrypto (Web Crypto API); MD5 has no SubtleCrypto support, so it is a
// pure-TS implementation of RFC 1321 below. Everything runs client-side —
// no text is ever uploaded.

export type ShaAlgo = 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** SHA-1/256/384/512 via the Web Crypto API. Lowercase hex digest. */
export async function sha(algo: ShaAlgo, text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest(algo, data);
  return toHex(digest);
}

// ---------------------------------------------------------------------------
// MD5 (RFC 1321) — pure TS, used because SubtleCrypto does not support MD5.
// ---------------------------------------------------------------------------

// Per-round left-rotate amounts.
const S = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14,
  20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6,
  10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
];

// K[i] = floor(abs(sin(i + 1)) * 2^32), precomputed per RFC 1321.
const K = [
  0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee, 0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
  0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be, 0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
  0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa, 0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
  0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed, 0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
  0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c, 0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
  0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05, 0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
  0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039, 0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
  0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1, 0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391,
];

function rotl(x: number, n: number): number {
  return (x << n) | (x >>> (32 - n));
}

// Pads the UTF-8 bytes of `text` per RFC 1321 (append 0x80, zero-pad, then
// the 64-bit little-endian bit length) and returns them as 32-bit LE words.
function md5Words(text: string): Uint32Array {
  const msg = new TextEncoder().encode(text);
  const bitLen = msg.length * 8;

  // Padded length: original + 0x80 byte + zeros, so length % 64 === 56, plus
  // 8 bytes for the bit-length suffix.
  let paddedLen = msg.length + 1;
  while (paddedLen % 64 !== 56) paddedLen++;
  paddedLen += 8;

  const padded = new Uint8Array(paddedLen);
  padded.set(msg);
  padded[msg.length] = 0x80;

  // 64-bit little-endian bit length (bitLen fits well within 32 bits for any
  // realistic input, so the high 32 bits are always zero here).
  const view = new DataView(padded.buffer);
  view.setUint32(paddedLen - 8, bitLen >>> 0, true);
  view.setUint32(paddedLen - 4, Math.floor(bitLen / 0x100000000), true);

  const words = new Uint32Array(paddedLen / 4);
  for (let i = 0; i < words.length; i++) {
    words[i] = view.getUint32(i * 4, true);
  }
  return words;
}

/** Pure-TS MD5 (RFC 1321) of a UTF-8 string. Returns lowercase hex digest. */
export function md5(text: string): string {
  const words = md5Words(text);

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;

  for (let chunk = 0; chunk < words.length; chunk += 16) {
    const M = words.subarray(chunk, chunk + 16);
    let [a, b, c, d] = [a0, b0, c0, d0];

    for (let i = 0; i < 64; i++) {
      let f: number;
      let g: number;

      if (i < 16) {
        f = (b & c) | (~b & d);
        g = i;
      } else if (i < 32) {
        f = (d & b) | (~d & c);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        f = b ^ c ^ d;
        g = (3 * i + 5) % 16;
      } else {
        f = c ^ (b | ~d);
        g = (7 * i) % 16;
      }

      f = (f + a + K[i] + M[g]) | 0;
      a = d;
      d = c;
      c = b;
      b = (b + rotl(f, S[i])) | 0;
    }

    a0 = (a0 + a) | 0;
    b0 = (b0 + b) | 0;
    c0 = (c0 + c) | 0;
    d0 = (d0 + d) | 0;
  }

  // Digest = a0,b0,c0,d0 each written little-endian, concatenated.
  const out = new Uint8Array(16);
  const view = new DataView(out.buffer);
  view.setUint32(0, a0 >>> 0, true);
  view.setUint32(4, b0 >>> 0, true);
  view.setUint32(8, c0 >>> 0, true);
  view.setUint32(12, d0 >>> 0, true);

  return Array.from(out)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
