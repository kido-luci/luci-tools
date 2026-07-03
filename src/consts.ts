// Site-wide constants + this engine's tool registry. The hub page and the
// sitemap are generated from TOOLS, so adding a page = one entry here + the
// page file.

export const SITE = {
  url: 'https://tools.luci-studio.com',
  name: 'Luci Tools',
} as const;

export interface ToolMeta {
  /** kebab-case keyword slug, e.g. `base64-encode` */
  slug: string;
  /** card title on the hub + nav label */
  title: string;
  /** meta description for the page */
  description: string;
  /** the single <h1> for the page */
  h1: string;
  /** icon name (see Icon.astro registry) shown beside the page title */
  icon: string;
}

export const TOOLS: ToolMeta[] = [
  {
    slug: 'base64-encode',
    title: 'Base64 Encode',
    h1: 'Base64 Encode',
    icon: 'code',
    description:
      'Encode text to Base64 in your browser — fast, free and private. Unicode-safe; nothing is uploaded, conversion happens 100% on your device.',
  },
  {
    slug: 'base64-decode',
    title: 'Base64 Decode',
    h1: 'Base64 Decode',
    icon: 'code',
    description:
      'Decode Base64 strings back to readable text in your browser — free, instant and private. Unicode-safe; nothing ever leaves your device.',
  },
  {
    slug: 'url-encode',
    title: 'URL Encode',
    h1: 'URL Encode',
    icon: 'code',
    description:
      'Percent-encode text for safe use in URLs, query strings and form data — free, instant and private, entirely in your browser.',
  },
  {
    slug: 'url-decode',
    title: 'URL Decode',
    h1: 'URL Decode',
    icon: 'code',
    description:
      'Decode percent-encoded URLs and query strings back to readable text — free, instant and private, entirely in your browser.',
  },
  {
    slug: 'html-entity-encoder',
    title: 'HTML Entity Encoder',
    h1: 'HTML Entity Encoder',
    icon: 'code',
    description:
      'Escape and unescape HTML entities like &amp;, &lt; and &#39; in your browser — free, instant and private, nothing is uploaded.',
  },
  {
    slug: 'jwt-decoder',
    title: 'JWT Decoder',
    h1: 'JWT Decoder',
    icon: 'code',
    description:
      'Decode a JWT header and payload to readable JSON in your browser — free, instant and private. Decodes only; it does not verify the signature.',
  },
];

/** Base-aware, trailing-slash URL for a tool slug (e.g. `/encode/base64-encode/`). */
export function toolUrl(slug: string): string {
  return `${import.meta.env.BASE_URL}${slug}/`;
}
