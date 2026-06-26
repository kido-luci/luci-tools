// Site-wide constants + this engine's tool registry. The hub page and the
// sitemap are generated from TOOLS, so adding a page = one entry here + the
// page file.

export const SITE = {
  url: 'https://tools.luci-studio.com',
  name: 'Luci Tools',
} as const;

export interface ToolMeta {
  /** kebab-case keyword slug, e.g. `json-formatter` */
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
    slug: 'json-formatter',
    title: 'JSON Formatter',
    h1: 'JSON Formatter & Validator',
    description:
      'Paste messy JSON and get clean, indented output with clear validation errors — free, instant and private. Your data is processed in your browser and never uploaded.',
  },
  {
    slug: 'json-minifier',
    title: 'JSON Minifier',
    h1: 'JSON Minifier',
    description:
      'Strip whitespace from JSON to get the smallest valid output — free, instant and private. Everything runs in your browser; nothing is uploaded.',
  },
];

/** Base-aware, trailing-slash URL for a tool slug (e.g. `/json/json-formatter/`). */
export function toolUrl(slug: string): string {
  return `${import.meta.env.BASE_URL}${slug}/`;
}
