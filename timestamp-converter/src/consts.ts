// Site-wide constants + this engine's tool registry. The hub page and the
// sitemap are generated from TOOLS, so adding a page = one entry here + the
// page file.

export const SITE = {
  url: 'https://tools.luci-studio.com',
  name: 'Luci Tools',
} as const;

export interface ToolMeta {
  /** kebab-case keyword slug, e.g. `unix-timestamp-converter` */
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
    slug: 'unix-timestamp-converter',
    title: 'Unix Timestamp Converter',
    h1: 'Unix Timestamp Converter',
    icon: 'convert',
    description:
      'Convert a Unix timestamp to a human-readable date, or a date back to epoch seconds — live, in your browser. Nothing is uploaded.',
  },
  {
    slug: 'epoch-to-date',
    title: 'Epoch to Date',
    h1: 'Epoch to Date Converter',
    icon: 'convert',
    description:
      'Convert a Unix epoch timestamp (seconds or milliseconds) into a readable UTC date and time, instantly and privately in your browser.',
  },
  {
    slug: 'date-to-unix-timestamp',
    title: 'Date to Unix Timestamp',
    h1: 'Date to Unix Timestamp',
    icon: 'convert',
    description:
      'Convert any date and time into a Unix timestamp — epoch seconds and milliseconds — instantly and privately in your browser.',
  },
];

/** Base-aware, trailing-slash URL for a tool slug (e.g. `/time/epoch-to-date/`). */
export function toolUrl(slug: string): string {
  return `${import.meta.env.BASE_URL}${slug}/`;
}
