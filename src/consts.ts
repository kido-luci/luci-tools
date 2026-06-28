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
  tools: CatalogTool[];
}

export const ENGINES: Engine[] = [
  {
    prefix: 'image',
    name: 'Image',
    icon: 'image',
    blurb: 'Convert images right in your browser — no upload, nothing stored.',
    tools: [
      { slug: 'heic-to-jpg', title: 'HEIC to JPG', description: 'Convert iPhone HEIC photos to JPG, 100% on your device.', icon: 'image' },
      { slug: 'png-to-jpg', title: 'PNG to JPG', description: 'Turn PNG images into smaller JPG files instantly.', icon: 'layers' },
    ],
  },
  {
    prefix: 'fancy-text',
    name: 'Fancy Text',
    icon: 'sparkle',
    blurb: 'Generate copy-paste Unicode text styles for bios and captions.',
    tools: [
      { slug: 'bold-text-generator', title: 'Bold Text Generator', description: 'Turn plain text into bold Unicode for bios and posts.', icon: 'bold', specimen: '𝗔𝗮' },
      { slug: 'italic-text-generator', title: 'Italic Text Generator', description: 'Make slanted italic text for captions and titles.', icon: 'italic', specimen: '𝘈𝘢' },
      { slug: 'strikethrough-text-generator', title: 'Strikethrough Text Generator', description: 'Add a strike through any text in one click.', icon: 'strikethrough', specimen: 'A̶a̶' },
    ],
  },
  {
    prefix: 'json',
    name: 'JSON',
    icon: 'braces',
    blurb: 'Format, validate and minify JSON privately in your browser.',
    tools: [
      { slug: 'json-formatter', title: 'JSON Formatter', description: 'Pretty-print and validate messy JSON.', icon: 'braces' },
      { slug: 'json-minifier', title: 'JSON Minifier', description: 'Strip whitespace to the smallest valid JSON.', icon: 'minimize' },
    ],
  },
  {
    prefix: 'qr',
    name: 'QR Code',
    icon: 'qr',
    blurb: 'Generate QR codes for links and WiFi — download PNG or SVG.',
    tools: [
      { slug: 'qr-code-generator', title: 'QR Code Generator', description: 'Make a QR code from any text or URL.', icon: 'qr' },
      { slug: 'wifi-qr-code-generator', title: 'WiFi QR Code', description: 'Let guests join your WiFi by scanning.', icon: 'wifi' },
    ],
  },
  {
    prefix: 'pdf',
    name: 'PDF',
    icon: 'file',
    blurb: 'Merge and build PDFs in your browser — nothing is uploaded.',
    tools: [
      { slug: 'merge-pdf', title: 'Merge PDF', description: 'Combine several PDF files into one.', icon: 'layers' },
      { slug: 'jpg-to-pdf', title: 'JPG to PDF', description: 'Turn JPG/PNG images into a single PDF.', icon: 'file' },
    ],
  },
];

/** Trailing-slash hub URL for an engine category, e.g. `/image/`. */
export const engineUrl = (prefix: string): string => `/${prefix}/`;

/** Trailing-slash URL for a tool, e.g. `/image/heic-to-jpg/`. */
export const toolUrl = (prefix: string, slug: string): string => `/${prefix}/${slug}/`;
