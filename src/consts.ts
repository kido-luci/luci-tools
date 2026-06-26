// Site-wide constants + this engine's tool registry. The hub page and the
// sitemap are generated from TOOLS, so adding a page = one entry here + the
// page file.

export const SITE = {
  url: 'https://tools.luci-studio.com',
  name: 'Luci Tools',
} as const;

export interface ToolMeta {
  /** kebab-case keyword slug, e.g. `qr-code-generator` */
  slug: string;
  /** card title on the hub + nav label */
  title: string;
  /** meta description for the page */
  description: string;
  /** the single <h1> for the page */
  h1: string;
}

export const TOOLS: ToolMeta[] = [
  {
    slug: 'qr-code-generator',
    title: 'QR Code Generator',
    h1: 'QR Code Generator',
    description:
      'Generate a QR code from any text or URL in your browser — free, instant and private. Download as PNG or SVG; nothing you enter is uploaded.',
  },
  {
    slug: 'wifi-qr-code-generator',
    title: 'WiFi QR Code',
    h1: 'WiFi QR Code Generator',
    description:
      'Create a WiFi QR code so guests can join your network by scanning — no typing the password. Built entirely in your browser; download PNG or SVG.',
  },
];

/** Base-aware, trailing-slash URL for a tool slug (e.g. `/qr/qr-code-generator/`). */
export function toolUrl(slug: string): string {
  return `${import.meta.env.BASE_URL}${slug}/`;
}
