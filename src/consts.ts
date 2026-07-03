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
  /** icon name (see Icon.astro registry) shown beside the page title */
  icon: string;
}

export const TOOLS: ToolMeta[] = [
  {
    slug: 'heic-to-jpg',
    title: 'HEIC to JPG',
    h1: 'HEIC to JPG Converter',
    icon: 'image',
    description:
      'Convert HEIC photos to JPG in your browser — fast, free and private. Nothing is uploaded; conversion happens 100% on your device.',
  },
  {
    slug: 'png-to-jpg',
    title: 'PNG to JPG',
    h1: 'PNG to JPG Converter',
    icon: 'layers',
    description:
      'Convert PNG images to JPG in your browser — free, instant and private. Files never leave your device.',
  },
  {
    slug: 'webp-to-jpg',
    title: 'WebP to JPG',
    h1: 'WebP to JPG Converter',
    icon: 'image',
    description:
      'Convert WebP images to JPG in your browser — free, instant and private. Nothing is uploaded; conversion happens 100% on your device.',
  },
  {
    slug: 'jpg-to-png',
    title: 'JPG to PNG',
    h1: 'JPG to PNG Converter',
    icon: 'layers',
    description:
      'Convert JPG images to PNG in your browser — free, instant and private. Files never leave your device.',
  },
  {
    slug: 'png-to-webp',
    title: 'PNG to WebP',
    h1: 'PNG to WebP Converter',
    icon: 'layers',
    description:
      'Convert PNG images to WebP in your browser — free, instant and private. Shrink files without uploading them anywhere.',
  },
  {
    slug: 'jpg-to-webp',
    title: 'JPG to WebP',
    h1: 'JPG to WebP Converter',
    icon: 'image',
    description:
      'Convert JPG images to WebP in your browser — free, instant and private. Smaller files for faster-loading web pages.',
  },
  {
    slug: 'heic-to-png',
    title: 'HEIC to PNG',
    h1: 'HEIC to PNG Converter',
    icon: 'image',
    description:
      'Convert HEIC photos to PNG in your browser — free, instant and private. Lossless, transparency-safe conversion with nothing uploaded.',
  },
];

/** Base-aware, trailing-slash URL for a tool slug (e.g. `/image/heic-to-jpg/`). */
export function toolUrl(slug: string): string {
  return `${import.meta.env.BASE_URL}${slug}/`;
}
