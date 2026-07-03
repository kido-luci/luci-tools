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
  /** icon name from Icon.astro registry, used for the badge above the page <h1> */
  icon: string;
}

export const TOOLS: ToolMeta[] = [
  {
    slug: 'qr-code-generator',
    title: 'QR Code Generator',
    h1: 'QR Code Generator',
    description:
      'Generate a QR code from any text or URL in your browser — free, instant and private. Download as PNG or SVG; nothing you enter is uploaded.',
    icon: 'qr',
  },
  {
    slug: 'wifi-qr-code-generator',
    title: 'WiFi QR Code',
    h1: 'WiFi QR Code Generator',
    description:
      'Create a WiFi QR code so guests can join your network by scanning — no typing the password. Built entirely in your browser; download PNG or SVG.',
    icon: 'wifi',
  },
  {
    slug: 'vcard-qr-code',
    title: 'vCard QR Code',
    h1: 'vCard QR Code Generator',
    description:
      'Turn your contact details into a scannable vCard QR code — perfect for business cards and email signatures. Built in your browser; download PNG or SVG.',
    icon: 'file',
  },
  {
    slug: 'email-qr-code',
    title: 'Email QR Code',
    h1: 'Email QR Code Generator',
    description:
      'Make an email QR code that opens a pre-filled message when scanned. Great for capturing enquiries on posters and cards. In-browser; download PNG or SVG.',
    icon: 'text',
  },
  {
    slug: 'url-qr-code',
    title: 'URL QR Code',
    h1: 'URL QR Code Generator',
    description:
      'Turn any link into a QR code — website, landing page or social profile. Scanners open it instantly. Built in your browser; download PNG or SVG.',
    icon: 'convert',
  },
];

/** Base-aware, trailing-slash URL for a tool slug (e.g. `/qr/qr-code-generator/`). */
export function toolUrl(slug: string): string {
  return `${import.meta.env.BASE_URL}${slug}/`;
}
