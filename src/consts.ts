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
}

export interface Engine {
  /** URL prefix / first path segment, e.g. `image` (matches the engine's Astro base) */
  prefix: string;
  /** category display name */
  name: string;
  /** glyph shown in the category badge */
  glyph: string;
  /** short category blurb */
  blurb: string;
  tools: CatalogTool[];
}

export const ENGINES: Engine[] = [
  {
    prefix: 'image',
    name: 'Image',
    glyph: '⇄',
    blurb: 'Convert images right in your browser — no upload, nothing stored.',
    tools: [
      { slug: 'heic-to-jpg', title: 'HEIC to JPG', description: 'Convert iPhone HEIC photos to JPG, 100% on your device.' },
      { slug: 'png-to-jpg', title: 'PNG to JPG', description: 'Turn PNG images into smaller JPG files instantly.' },
    ],
  },
  {
    prefix: 'fancy-text',
    name: 'Fancy Text',
    glyph: '✦',
    blurb: 'Generate copy-paste Unicode text styles for bios and captions.',
    tools: [
      { slug: 'bold-text-generator', title: 'Bold Text Generator', description: 'Make 𝗯𝗼𝗹𝗱 Unicode text for social bios.' },
      { slug: 'italic-text-generator', title: 'Italic Text Generator', description: 'Create 𝘪𝘵𝘢𝘭𝘪𝘤 text that pastes anywhere.' },
      { slug: 'strikethrough-text-generator', title: 'Strikethrough Text Generator', description: 'Add a s̶t̶r̶i̶k̶e̶ line through your text.' },
    ],
  },
  {
    prefix: 'json',
    name: 'JSON',
    glyph: '{ }',
    blurb: 'Format, validate and minify JSON privately in your browser.',
    tools: [
      { slug: 'json-formatter', title: 'JSON Formatter', description: 'Pretty-print and validate messy JSON.' },
      { slug: 'json-minifier', title: 'JSON Minifier', description: 'Strip whitespace to the smallest valid JSON.' },
    ],
  },
  {
    prefix: 'qr',
    name: 'QR Code',
    glyph: 'QR',
    blurb: 'Generate QR codes for links and WiFi — download PNG or SVG.',
    tools: [
      { slug: 'qr-code-generator', title: 'QR Code Generator', description: 'Make a QR code from any text or URL.' },
      { slug: 'wifi-qr-code-generator', title: 'WiFi QR Code', description: 'Let guests join your WiFi by scanning.' },
    ],
  },
  {
    prefix: 'pdf',
    name: 'PDF',
    glyph: 'PDF',
    blurb: 'Merge and build PDFs in your browser — nothing is uploaded.',
    tools: [
      { slug: 'merge-pdf', title: 'Merge PDF', description: 'Combine several PDF files into one.' },
      { slug: 'jpg-to-pdf', title: 'JPG to PDF', description: 'Turn JPG/PNG images into a single PDF.' },
    ],
  },
];

/** Trailing-slash hub URL for an engine category, e.g. `/image/`. */
export const engineUrl = (prefix: string): string => `/${prefix}/`;

/** Trailing-slash URL for a tool, e.g. `/image/heic-to-jpg/`. */
export const toolUrl = (prefix: string, slug: string): string => `/${prefix}/${slug}/`;
