// Site-wide constants + this engine's tool registry. The hub page and the
// sitemap are generated from TOOLS, so adding a page = one entry here + the
// page file.

export const SITE = {
  url: 'https://tools.luci-studio.com',
  name: 'Luci Tools',
} as const;

export interface ToolMeta {
  /** kebab-case keyword slug, e.g. `heic-to-jpg` */
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
    slug: 'heic-to-jpg',
    title: 'HEIC to JPG',
    h1: 'HEIC to JPG Converter',
    description:
      'Convert HEIC photos to JPG in your browser — fast, free and private. Nothing is uploaded; conversion happens 100% on your device.',
  },
  {
    slug: 'png-to-jpg',
    title: 'PNG to JPG',
    h1: 'PNG to JPG Converter',
    description:
      'Convert PNG images to JPG in your browser — free, instant and private. Files never leave your device.',
  },
];

/** Base-aware, trailing-slash URL for a tool slug (e.g. `/image/heic-to-jpg/`). */
export function toolUrl(slug: string): string {
  return `${import.meta.env.BASE_URL}${slug}/`;
}
