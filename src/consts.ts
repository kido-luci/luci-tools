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
  /** optional styled specimen shown as a chip on the card (e.g. fancy-text) */
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
  tools: CatalogTool[];
}

export const ENGINES: Engine[] = [
  {
    prefix: 'image',
    name: 'Image',
    icon: 'image',
    blurb: 'Convert images right in your browser — no upload, nothing stored.',
    accentHex: '#f97316',
    tools: [
      { slug: 'heic-to-jpg', title: 'HEIC to JPG', description: 'Convert iPhone HEIC photos to JPG, 100% on your device.', icon: 'image' },
      { slug: 'png-to-jpg', title: 'PNG to JPG', description: 'Turn PNG images into smaller JPG files instantly.', icon: 'layers' },
      { slug: 'webp-to-jpg', title: 'WebP to JPG', description: 'Convert WebP images to widely-supported JPG.', icon: 'convert' },
      { slug: 'jpg-to-png', title: 'JPG to PNG', description: 'Convert JPG photos to lossless PNG.', icon: 'convert' },
      { slug: 'png-to-webp', title: 'PNG to WebP', description: 'Shrink PNG images down to modern WebP.', icon: 'convert' },
      { slug: 'jpg-to-webp', title: 'JPG to WebP', description: 'Compress JPG photos to smaller WebP files.', icon: 'convert' },
      { slug: 'heic-to-png', title: 'HEIC to PNG', description: 'Convert iPhone HEIC photos to lossless PNG.', icon: 'convert' },
      { slug: 'avif-to-jpg', title: 'AVIF to JPG', description: 'Convert modern AVIF images to JPG.', icon: 'convert' },
      { slug: 'svg-to-png', title: 'SVG to PNG', description: 'Rasterize SVG vector files to PNG.', icon: 'convert' },
    ],
  },
  {
    prefix: 'fancy-text',
    name: 'Fancy Text',
    icon: 'sparkle',
    blurb: 'Generate copy-paste Unicode text styles for bios and captions.',
    accentHex: '#c026d3',
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
    tools: [
      { slug: 'json-formatter', title: 'JSON Formatter', description: 'Pretty-print and validate messy JSON.', icon: 'braces' },
      { slug: 'json-minifier', title: 'JSON Minifier', description: 'Strip whitespace to the smallest valid JSON.', icon: 'minimize' },
      { slug: 'json-validator', title: 'JSON Validator', description: 'Check JSON for syntax errors instantly.', icon: 'check' },
      { slug: 'json-to-csv', title: 'JSON to CSV', description: 'Convert a JSON array into CSV rows.', icon: 'convert' },
      { slug: 'csv-to-json', title: 'CSV to JSON', description: 'Turn CSV data into a JSON array.', icon: 'convert' },
    ],
  },
  {
    prefix: 'qr',
    name: 'QR Code',
    icon: 'qr',
    blurb: 'Generate QR codes for links and WiFi — download PNG or SVG.',
    accentHex: '#0284c7',
    tools: [
      { slug: 'qr-code-generator', title: 'QR Code Generator', description: 'Make a QR code from any text or URL.', icon: 'qr' },
      { slug: 'wifi-qr-code-generator', title: 'WiFi QR Code', description: 'Let guests join your WiFi by scanning.', icon: 'wifi' },
      { slug: 'vcard-qr-code', title: 'vCard QR Code', description: 'Share your contact details as a QR code.', icon: 'file' },
      { slug: 'email-qr-code', title: 'Email QR Code', description: 'Make a QR that opens a pre-filled email.', icon: 'text' },
      { slug: 'url-qr-code', title: 'URL QR Code', description: 'Turn any link into a scannable QR code.', icon: 'convert' },
      { slug: 'qr-code-with-logo', title: 'QR Code with Logo', description: 'Add your logo to the center of a QR.', icon: 'image' },
    ],
  },
  {
    prefix: 'pdf',
    name: 'PDF',
    icon: 'file',
    blurb: 'Merge and build PDFs in your browser — nothing is uploaded.',
    accentHex: '#e11d48',
    tools: [
      { slug: 'merge-pdf', title: 'Merge PDF', description: 'Combine several PDF files into one.', icon: 'layers' },
      { slug: 'jpg-to-pdf', title: 'JPG to PDF', description: 'Turn JPG/PNG images into a single PDF.', icon: 'file' },
      { slug: 'png-to-pdf', title: 'PNG to PDF', description: 'Turn PNG images into a single PDF.', icon: 'file' },
      { slug: 'rotate-pdf', title: 'Rotate PDF', description: 'Rotate PDF pages by 90, 180 or 270°.', icon: 'convert' },
      { slug: 'split-pdf', title: 'Split PDF', description: 'Split a PDF into one file per page.', icon: 'layers' },
    ],
  },
  {
    prefix: 'unit',
    name: 'Unit Converter',
    icon: 'convert',
    blurb: 'Convert length, weight and temperature units right in your browser.',
    accentHex: '#d97706',
    tools: [
      { slug: 'cm-to-inches', title: 'CM to Inches', description: 'Convert centimetres to inches.', icon: 'convert' },
      { slug: 'inches-to-cm', title: 'Inches to CM', description: 'Convert inches to centimetres.', icon: 'convert' },
      { slug: 'mm-to-inches', title: 'MM to Inches', description: 'Convert millimetres to inches.', icon: 'convert' },
      { slug: 'meters-to-feet', title: 'Meters to Feet', description: 'Convert metres to feet.', icon: 'convert' },
      { slug: 'feet-to-meters', title: 'Feet to Meters', description: 'Convert feet to metres.', icon: 'convert' },
      { slug: 'km-to-miles', title: 'KM to Miles', description: 'Convert kilometres to miles.', icon: 'convert' },
      { slug: 'miles-to-km', title: 'Miles to KM', description: 'Convert miles to kilometres.', icon: 'convert' },
      { slug: 'kg-to-lbs', title: 'KG to Lbs', description: 'Convert kilograms to pounds.', icon: 'convert' },
      { slug: 'lbs-to-kg', title: 'Lbs to KG', description: 'Convert pounds to kilograms.', icon: 'convert' },
      { slug: 'celsius-to-fahrenheit', title: 'Celsius to Fahrenheit', description: 'Convert °C to °F.', icon: 'convert' },
      { slug: 'fahrenheit-to-celsius', title: 'Fahrenheit to Celsius', description: 'Convert °F to °C.', icon: 'convert' },
    ],
  },
];

/** Trailing-slash hub URL for an engine category, e.g. `/image/`. */
export const engineUrl = (prefix: string): string => `/${prefix}/`;

/** Trailing-slash URL for a tool, e.g. `/image/heic-to-jpg/`. */
export const toolUrl = (prefix: string, slug: string): string => `/${prefix}/${slug}/`;
