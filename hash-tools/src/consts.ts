// Site-wide constants + this engine's tool registry. The hub page and the
// sitemap are generated from TOOLS, so adding a page = one entry here + the
// page file.

export const SITE = {
  url: 'https://tools.luci-studio.com',
  name: 'Luci Tools',
} as const;

export interface ToolMeta {
  /** kebab-case keyword slug, e.g. `md5-hash-generator` */
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
    slug: 'md5-hash-generator',
    title: 'MD5 Hash Generator',
    h1: 'MD5 Hash Generator',
    icon: 'lock',
    description:
      'Generate an MD5 hash from any text in your browser — free, instant and private. Nothing is uploaded; hashing happens 100% on your device.',
  },
  {
    slug: 'sha1-hash-generator',
    title: 'SHA-1 Hash Generator',
    h1: 'SHA-1 Hash Generator',
    icon: 'code',
    description:
      'Generate a SHA-1 hash from any text in your browser — free, instant and private. Files and text never leave your device.',
  },
  {
    slug: 'sha256-hash-generator',
    title: 'SHA-256 Hash Generator',
    h1: 'SHA-256 Hash Generator',
    icon: 'lock',
    description:
      'Generate a SHA-256 hash from any text in your browser — free, instant and private. Nothing is uploaded; hashing happens 100% on your device.',
  },
  {
    slug: 'sha512-hash-generator',
    title: 'SHA-512 Hash Generator',
    h1: 'SHA-512 Hash Generator',
    icon: 'code',
    description:
      'Generate a SHA-512 hash from any text in your browser — free, instant and private. Nothing is uploaded; hashing happens 100% on your device.',
  },
];

/** Base-aware, trailing-slash URL for a tool slug (e.g. `/hash/md5-hash-generator/`). */
export function toolUrl(slug: string): string {
  return `${import.meta.env.BASE_URL}${slug}/`;
}
