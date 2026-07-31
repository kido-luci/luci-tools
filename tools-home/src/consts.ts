// Site-wide constants + the PORTFOLIO catalog. Unlike an engine repo (which lists
// only its own tools), tools-home holds the cross-engine catalog used to render the
// hub and the sitemap index. Repos are independent (no shared package, by design),
// so an entry here is a deliberate one-line mirror of the engine's own tool.

export const SITE = {
  url: 'https://tools.luci-studio.com',
  name: 'Luci Tools',
} as const;

export interface CatalogTool {
  /** kebab-case keyword slug, e.g. `heic-to-jpg` */
  slug: string;
  /** card title on the hub */
  title: string;
  /** short one-line description for the hub card */
  description: string;
  /** icon name (see Icon.astro registry) shown on the card */
  icon: string;
  /** short monospace chip glyph on the hub card, e.g. `H→J`, `{ }`, `MD5` */
  chip?: string;
  /** optional styled Unicode specimen shown instead of a chip (fancy-text) */
  specimen?: string;
}

export interface Engine {
  /** URL prefix / first path segment, e.g. `image` (matches the engine's Astro base) */
  prefix: string;
  /** category display name */
  name: string;
  /** icon name (see Icon.astro registry) shown in the category badge */
  icon: string;
  /** short category blurb */
  blurb: string;
  /** hex color used for the gradient left-line accent on the home hub, e.g. `#f97316` */
  accentHex: string;
  /** OKLCH hue (deg) for the per-category tint used by the hub dot + card chips */
  hue: number;
  tools: CatalogTool[];
}

export const ENGINES: Engine[] = [
  {
    prefix: 'image',
    name: 'Image',
    icon: 'image',
    blurb: 'Convert images right in your browser — no upload, nothing stored.',
    accentHex: '#f97316',
    hue: 34,
    tools: [
      { slug: 'heic-to-jpg', title: 'HEIC to JPG', description: 'Convert iPhone HEIC photos to JPG, 100% on your device.', icon: 'image', chip: 'H→J' },
      { slug: 'png-to-jpg', title: 'PNG to JPG', description: 'Turn PNG images into smaller JPG files instantly.', icon: 'layers', chip: 'P→J' },
      { slug: 'webp-to-jpg', title: 'WebP to JPG', description: 'Convert WebP images to widely-supported JPG.', icon: 'convert', chip: 'W→J' },
      { slug: 'jpg-to-png', title: 'JPG to PNG', description: 'Convert JPG photos to lossless PNG.', icon: 'convert', chip: 'J→P' },
      { slug: 'png-to-webp', title: 'PNG to WebP', description: 'Shrink PNG images down to modern WebP.', icon: 'convert', chip: 'P→W' },
      { slug: 'jpg-to-webp', title: 'JPG to WebP', description: 'Compress JPG photos to smaller WebP files.', icon: 'convert', chip: 'J→W' },
      { slug: 'heic-to-png', title: 'HEIC to PNG', description: 'Convert iPhone HEIC photos to lossless PNG.', icon: 'convert', chip: 'H→P' },
      { slug: 'avif-to-jpg', title: 'AVIF to JPG', description: 'Convert modern AVIF images to JPG.', icon: 'convert', chip: 'A→J' },
      { slug: 'svg-to-png', title: 'SVG to PNG', description: 'Rasterize SVG vector files to PNG.', icon: 'convert', chip: 'S→P' },
    ],
  },
  {
    prefix: 'fancy-text',
    name: 'Fancy Text',
    icon: 'sparkle',
    blurb: 'Generate copy-paste Unicode text styles for bios and captions.',
    accentHex: '#c026d3',
    hue: 338,
    tools: [
      { slug: 'bold-text-generator', title: 'Bold Text Generator', description: 'Turn plain text into bold Unicode for bios and posts.', icon: 'bold', specimen: '𝗔𝗮' },
      { slug: 'italic-text-generator', title: 'Italic Text Generator', description: 'Make slanted italic text for captions and titles.', icon: 'italic', specimen: '𝘈𝘢' },
      { slug: 'strikethrough-text-generator', title: 'Strikethrough Text Generator', description: 'Add a strike through any text in one click.', icon: 'strikethrough', specimen: 'A̶a̶' },
      { slug: 'cursive-text-generator', title: 'Cursive Text Generator', description: 'Write flowing cursive script text for bios.', icon: 'sparkle', specimen: '𝓐𝓪' },
      { slug: 'bubble-text-generator', title: 'Bubble Text Generator', description: 'Wrap letters in bubbles for cute captions.', icon: 'sparkle', specimen: 'Ⓐⓐ' },
      { slug: 'wide-text-generator', title: 'Wide Text Generator', description: 'Make wide full-width vaporwave text.', icon: 'sparkle', specimen: 'Ａａ' },
      { slug: 'monospace-text-generator', title: 'Monospace Text Generator', description: 'Fixed-width monospace text for a code look.', icon: 'sparkle', specimen: '𝙰𝚊' },
      { slug: 'underline-text-generator', title: 'Underline Text Generator', description: 'Add an underline to any text in one click.', icon: 'sparkle', specimen: 'A̲a̲' },
    ],
  },
  {
    prefix: 'json',
    name: 'JSON',
    icon: 'braces',
    blurb: 'Format, validate and minify JSON privately in your browser.',
    accentHex: '#059669',
    hue: 156,
    tools: [
      { slug: 'json-formatter', title: 'JSON Formatter', description: 'Pretty-print and validate messy JSON.', icon: 'braces', chip: '{ }' },
      { slug: 'json-minifier', title: 'JSON Minifier', description: 'Strip whitespace to the smallest valid JSON.', icon: 'minimize', chip: '{-}' },
      { slug: 'json-validator', title: 'JSON Validator', description: 'Check JSON for syntax errors instantly.', icon: 'check', chip: '{✓}' },
      { slug: 'json-to-csv', title: 'JSON to CSV', description: 'Convert a JSON array into CSV rows.', icon: 'convert', chip: 'J→C' },
      { slug: 'csv-to-json', title: 'CSV to JSON', description: 'Turn CSV data into a JSON array.', icon: 'convert', chip: 'C→J' },
    ],
  },
  {
    prefix: 'qr',
    name: 'QR Code',
    icon: 'qr',
    blurb: 'Generate QR codes for links and WiFi — download PNG or SVG.',
    accentHex: '#0284c7',
    hue: 266,
    tools: [
      { slug: 'qr-code-generator', title: 'QR Code Generator', description: 'Make a QR code from any text or URL.', icon: 'qr', chip: '▦' },
      { slug: 'wifi-qr-code-generator', title: 'WiFi QR Code', description: 'Let guests join your WiFi by scanning.', icon: 'wifi', chip: 'wifi' },
      { slug: 'vcard-qr-code', title: 'vCard QR Code', description: 'Share your contact details as a QR code.', icon: 'file', chip: 'vC' },
      { slug: 'email-qr-code', title: 'Email QR Code', description: 'Make a QR that opens a pre-filled email.', icon: 'text', chip: '@' },
      { slug: 'url-qr-code', title: 'URL QR Code', description: 'Turn any link into a scannable QR code.', icon: 'convert', chip: 'url' },
      { slug: 'qr-code-with-logo', title: 'QR Code with Logo', description: 'Add your logo to the center of a QR.', icon: 'image', chip: '▦+' },
    ],
  },
  {
    prefix: 'pdf',
    name: 'PDF',
    icon: 'file',
    blurb: 'Merge and build PDFs in your browser — nothing is uploaded.',
    accentHex: '#e11d48',
    hue: 16,
    tools: [
      { slug: 'merge-pdf', title: 'Merge PDF', description: 'Combine several PDF files into one.', icon: 'layers', chip: '⊕' },
      { slug: 'jpg-to-pdf', title: 'JPG to PDF', description: 'Turn JPG/PNG images into a single PDF.', icon: 'file', chip: 'J▤' },
      { slug: 'png-to-pdf', title: 'PNG to PDF', description: 'Turn PNG images into a single PDF.', icon: 'file', chip: 'P▤' },
      { slug: 'rotate-pdf', title: 'Rotate PDF', description: 'Rotate PDF pages by 90, 180 or 270°.', icon: 'convert', chip: '↻' },
      { slug: 'split-pdf', title: 'Split PDF', description: 'Split a PDF into one file per page.', icon: 'layers', chip: '⑂' },
    ],
  },
  {
    prefix: 'unit',
    name: 'Unit Converter',
    icon: 'convert',
    blurb: 'Convert length, weight and temperature units right in your browser.',
    accentHex: '#d97706',
    hue: 202,
    tools: [
      { slug: 'cm-to-inches', title: 'CM to Inches', description: 'Convert centimetres to inches.', icon: 'convert', chip: 'cm→in' },
      { slug: 'inches-to-cm', title: 'Inches to CM', description: 'Convert inches to centimetres.', icon: 'convert', chip: 'in→cm' },
      { slug: 'mm-to-inches', title: 'MM to Inches', description: 'Convert millimetres to inches.', icon: 'convert', chip: 'mm→in' },
      { slug: 'meters-to-feet', title: 'Meters to Feet', description: 'Convert metres to feet.', icon: 'convert', chip: 'm→ft' },
      { slug: 'feet-to-meters', title: 'Feet to Meters', description: 'Convert feet to metres.', icon: 'convert', chip: 'ft→m' },
      { slug: 'km-to-miles', title: 'KM to Miles', description: 'Convert kilometres to miles.', icon: 'convert', chip: 'km→mi' },
      { slug: 'miles-to-km', title: 'Miles to KM', description: 'Convert miles to kilometres.', icon: 'convert', chip: 'mi→km' },
      { slug: 'kg-to-lbs', title: 'KG to Lbs', description: 'Convert kilograms to pounds.', icon: 'convert', chip: 'kg→lb' },
      { slug: 'lbs-to-kg', title: 'Lbs to KG', description: 'Convert pounds to kilograms.', icon: 'convert', chip: 'lb→kg' },
      { slug: 'celsius-to-fahrenheit', title: 'Celsius to Fahrenheit', description: 'Convert °C to °F.', icon: 'convert', chip: '°C→F' },
      { slug: 'fahrenheit-to-celsius', title: 'Fahrenheit to Celsius', description: 'Convert °F to °C.', icon: 'convert', chip: '°F→C' },
    ],
  },
  {
    prefix: 'hash',
    name: 'Hash Generator',
    icon: 'code',
    blurb: 'Generate MD5, SHA-1, SHA-256 and SHA-512 hashes in your browser.',
    accentHex: '#6366f1',
    hue: 292,
    tools: [
      { slug: 'md5-hash-generator', title: 'MD5 Hash', description: 'Generate an MD5 hash from any text.', icon: 'code', chip: 'MD5' },
      { slug: 'sha256-hash-generator', title: 'SHA-256 Hash', description: 'Generate a SHA-256 hash from text.', icon: 'code', chip: '256' },
      { slug: 'sha1-hash-generator', title: 'SHA-1 Hash', description: 'Generate a SHA-1 hash from text.', icon: 'code', chip: 'SHA1' },
      { slug: 'sha512-hash-generator', title: 'SHA-512 Hash', description: 'Generate a SHA-512 hash from text.', icon: 'code', chip: '512' },
    ],
  },
  {
    prefix: 'time',
    name: 'Timestamp',
    icon: 'convert',
    blurb: 'Convert between Unix timestamps and human-readable dates.',
    accentHex: '#0891b2',
    hue: 72,
    tools: [
      { slug: 'unix-timestamp-converter', title: 'Unix Timestamp Converter', description: 'Convert Unix timestamps to dates and back.', icon: 'convert', chip: 'TS' },
      { slug: 'epoch-to-date', title: 'Epoch to Date', description: 'Convert an epoch to a readable date.', icon: 'convert', chip: 'E→D' },
      { slug: 'date-to-unix-timestamp', title: 'Date to Unix Timestamp', description: 'Convert a date to a Unix timestamp.', icon: 'convert', chip: 'D→T' },
    ],
  },
  {
    prefix: 'encode',
    name: 'Encode / Decode',
    icon: 'code',
    blurb: 'Base64, URL and HTML entity encoders, plus a JWT decoder.',
    accentHex: '#7c3aed',
    hue: 236,
    tools: [
      { slug: 'base64-encode', title: 'Base64 Encode', description: 'Encode text to Base64.', icon: 'code', chip: '64↑' },
      { slug: 'base64-decode', title: 'Base64 Decode', description: 'Decode Base64 back to text.', icon: 'code', chip: '64↓' },
      { slug: 'url-encode', title: 'URL Encode', description: 'Percent-encode text for URLs.', icon: 'code', chip: '%↑' },
      { slug: 'url-decode', title: 'URL Decode', description: 'Decode percent-encoded URLs.', icon: 'code', chip: '%↓' },
      { slug: 'html-entity-encoder', title: 'HTML Entity Encoder', description: 'Encode and decode HTML entities.', icon: 'code', chip: '&#;' },
      { slug: 'jwt-decoder', title: 'JWT Decoder', description: 'Decode a JWT header and payload.', icon: 'code', chip: 'JWT' },
    ],
  },
  {
    prefix: 'color',
    name: 'Color Tools',
    icon: 'sparkle',
    blurb: 'Convert HEX, RGB and HSL colors and check WCAG contrast.',
    accentHex: '#db2777',
    hue: 352,
    tools: [
      { slug: 'hex-to-rgb', title: 'HEX to RGB', description: 'Convert HEX colors to RGB.', icon: 'sparkle', chip: 'hex' },
      { slug: 'rgb-to-hex', title: 'RGB to HEX', description: 'Convert RGB colors to HEX.', icon: 'sparkle', chip: 'rgb' },
      { slug: 'hex-to-hsl', title: 'HEX to HSL', description: 'Convert HEX colors to HSL.', icon: 'sparkle', chip: 'hsl' },
      { slug: 'color-contrast-checker', title: 'Contrast Checker', description: 'Check WCAG contrast ratios.', icon: 'sparkle', chip: '◐' },
    ],
  },
  {
    prefix: 'password',
    name: 'Password Tools',
    icon: 'lock',
    blurb: 'Generate strong passwords and passphrases, 100% in your browser.',
    accentHex: '#16a34a',
    hue: 130,
    tools: [
      { slug: 'password-generator', title: 'Password Generator', description: 'Generate strong random passwords.', icon: 'lock', chip: '•••' },
      { slug: 'strong-password-generator', title: 'Strong Password Generator', description: 'Create long, high-entropy passwords.', icon: 'lock', chip: '••✦' },
      { slug: 'passphrase-generator', title: 'Passphrase Generator', description: 'Generate memorable word passphrases.', icon: 'lock', chip: 'abc' },
    ],
  },
];

/** Trailing-slash hub URL for an engine category, e.g. `/image/`. */
export const engineUrl = (prefix: string): string => `/${prefix}/`;

/** Trailing-slash URL for a tool, e.g. `/image/heic-to-jpg/`. */
export const toolUrl = (prefix: string, slug: string): string => `/${prefix}/${slug}/`;
