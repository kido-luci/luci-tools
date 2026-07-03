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
  {
    slug: 'png-to-pdf',
    title: 'PNG to PDF',
    h1: 'PNG to PDF Converter',
    description:
      'Combine PNG screenshots and images into a single PDF in your browser — free, instant and private. Nothing is uploaded; everything happens on your device.',
    icon: 'file',
  },
  {
    slug: 'rotate-pdf',
    title: 'Rotate PDF',
    h1: 'Rotate PDF',
    description:
      'Rotate every page of a PDF by 90°, 180° or 270° in your browser — free, instant and private. Nothing is uploaded; everything happens on your device.',
    icon: 'convert',
  },
  {
    slug: 'split-pdf',
    title: 'Split PDF',
    h1: 'Split PDF',
    description:
      'Split a PDF into separate single-page files and download them as one ZIP — free, instant and private. Nothing is uploaded; everything happens in your browser.',
    icon: 'layers',
  },
];

/** Base-aware, trailing-slash URL for a tool slug (e.g. `/pdf/merge-pdf/`). */
export function toolUrl(slug: string): string {
  return `${import.meta.env.BASE_URL}${slug}/`;
}
