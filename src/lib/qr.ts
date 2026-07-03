// Client-side QR generation engine. Runs entirely in the browser via the
// `qrcode` package — text in, a PNG data URL or an SVG string out. No network.
import QRCode from 'qrcode';

export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

export interface QrOpts {
  width?: number;
  margin?: number;
  errorCorrectionLevel?: ErrorCorrectionLevel;
}

/** PNG data URL (default 512px) ready to drop into an <img> or download. */
export function toPngDataUrl(text: string, opts: QrOpts = {}): Promise<string> {
  return QRCode.toDataURL(text, {
    width: 512,
    margin: 2,
    errorCorrectionLevel: 'M',
    ...opts,
  });
}

/** Scalable SVG markup — crisp at any size, ideal for print. */
export function toSvgString(text: string, opts: QrOpts = {}): Promise<string> {
  return QRCode.toString(text, { type: 'svg', margin: 2, ...opts });
}

export type WifiEncryption = 'WPA' | 'WEP' | 'nopass';

export interface WifiParams {
  ssid: string;
  password: string;
  encryption: WifiEncryption;
  hidden: boolean;
}

// The WIFI: payload uses `;` `,` and `:` as separators, so those plus `\` and
// `"` must be backslash-escaped inside the SSID and password.
function escape(value: string): string {
  return value.replace(/([\\;,:"])/g, '\\$1');
}

/** Build the standard `WIFI:...;` payload a phone camera reads to join a network. */
export function buildWifiPayload({ ssid, password, encryption, hidden }: WifiParams): string {
  // Open networks carry no password field.
  const pass = encryption === 'nopass' ? '' : `P:${escape(password)};`;
  const hiddenPart = hidden ? 'H:true;' : '';
  return `WIFI:T:${encryption};S:${escape(ssid)};${pass}${hiddenPart};`;
}

export interface VcardParams {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  org: string;
  url: string;
}

// vCard text-value escaping: backslash, semicolon and comma are structural, so
// they must be backslash-escaped inside a name/FN value.
function escapeVcard(value: string): string {
  return value.replace(/([\\;,])/g, '\\$1');
}

/** Build a vCard 3.0 payload (CRLF-joined) that a phone reads to save a contact. */
export function buildVcardPayload({ firstName, lastName, phone, email, org, url }: VcardParams): string {
  const lines = ['BEGIN:VCARD', 'VERSION:3.0'];
  lines.push(`N:${escapeVcard(lastName)};${escapeVcard(firstName)};;;`);
  lines.push(`FN:${escapeVcard(`${firstName} ${lastName}`.trim())}`);
  // Optional lines are omitted entirely when their field is empty.
  if (org) lines.push(`ORG:${escapeVcard(org)}`);
  if (phone) lines.push(`TEL;TYPE=CELL:${phone}`);
  if (email) lines.push(`EMAIL:${email}`);
  if (url) lines.push(`URL:${url}`);
  lines.push('END:VCARD');
  return lines.join('\r\n');
}

export interface EmailParams {
  to: string;
  subject: string;
  body: string;
}

/** Build a `mailto:` payload that opens a pre-filled email when scanned. */
export function buildEmailPayload({ to, subject, body }: EmailParams): string {
  const params: string[] = [];
  if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
  if (body) params.push(`body=${encodeURIComponent(body)}`);
  const query = params.length ? `?${params.join('&')}` : '';
  return `mailto:${to}${query}`;
}
