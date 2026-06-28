// Site-wide constants + this engine's tool registry. The hub page and the
// sitemap are generated from TOOLS, so adding a page = one entry here + the
// page file.

export const SITE = {
  url: 'https://tools.luci-studio.com',
  name: 'Luci Tools',
} as const;

export interface ToolMeta {
  /** kebab-case keyword slug, e.g. `merge-pdf` */
  slug: string;
  /** card title on the hub + nav label */
  title: string;
  /** meta description for the page */
  description: string;
  /** the single <h1> for the page */
  h1: string;
  /** Lucide-style icon name used on the tool page badge and hub card */
  icon: string;
}

export const TOOLS: ToolMeta[] = [
  {
    slug: 'merge-pdf',
    title: 'Merge PDF',
    h1: 'Merge PDF',
    description:
      'Combine multiple PDF files into one in your browser — free, fast and private. Nothing is uploaded; everything happens 100% on your device.',
    icon: 'layers',
  },
  {
    slug: 'jpg-to-pdf',
    title: 'JPG to PDF',
    h1: 'JPG to PDF Converter',
    description:
      'Turn JPG and PNG images into a single PDF in your browser — free, instant and private. Your images never leave your device.',
    icon: 'file',
  },
];

/** Base-aware, trailing-slash URL for a tool slug (e.g. `/pdf/merge-pdf/`). */
export function toolUrl(slug: string): string {
  return `${import.meta.env.BASE_URL}${slug}/`;
}
