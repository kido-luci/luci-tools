// Dependency-free encode/decode engine. Every function is pure and runs
// entirely in the browser (or Node, for tests) — no WASM, no external libs.

/** Encode text to Base64. Unicode-safe (encodes the UTF-8 byte sequence, not raw char codes). */
export function base64Encode(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

/** Decode a Base64 string back to text. Unicode-safe — reverses base64Encode exactly. */
export function base64Decode(b64: string): string {
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** Percent-encode text for safe use in a URL component. */
export function urlEncode(text: string): string {
  return encodeURIComponent(text);
}

/** Decode a percent-encoded URL component back to text. */
export function urlDecode(text: string): string {
  return decodeURIComponent(text);
}

const HTML_ENCODE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Escape the 5 predefined HTML entities: & < > " ' */
export function htmlEntityEncode(text: string): string {
  return text.replace(/[&<>"']/g, (c) => HTML_ENCODE_MAP[c]);
}

const HTML_DECODE_MAP: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'",
  '&#39;': "'",
  '&#x27;': "'",
};

/** Reverse htmlEntityEncode, including numeric entities (&#39;, &#x27;). */
export function htmlEntityDecode(text: string): string {
  return text
    .replace(/&amp;|&lt;|&gt;|&quot;|&apos;|&#39;|&#x27;/gi, (m) => HTML_DECODE_MAP[m.toLowerCase()] ?? m)
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

/** Convert a base64url string (JWT segment encoding) to standard base64. */
function base64UrlToBase64(segment: string): string {
  let b64 = segment.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4;
  if (pad === 2) b64 += '==';
  else if (pad === 3) b64 += '=';
  else if (pad !== 0) throw new Error('Invalid base64url segment.');
  return b64;
}

export interface JwtDecoded {
  header: unknown;
  payload: unknown;
}

/**
 * Decode a JWT's header and payload to JSON. Decode ONLY — this does not
 * verify the signature, so the result must never be trusted for auth.
 */
export function jwtDecode(token: string): JwtDecoded {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT: expected 3 dot-separated parts (header.payload.signature).');
  }

  const [rawHeader, rawPayload] = parts;

  const decodePart = (segment: string, name: string): unknown => {
    let json: string;
    try {
      json = base64Decode(base64UrlToBase64(segment));
    } catch {
      throw new Error(`Invalid JWT: ${name} is not valid base64url.`);
    }
    try {
      return JSON.parse(json);
    } catch {
      throw new Error(`Invalid JWT: ${name} is not valid JSON.`);
    }
  };

  return {
    header: decodePart(rawHeader, 'header'),
    payload: decodePart(rawPayload, 'payload'),
  };
}
