// Site-wide constants + this engine's tool registry. The hub page and the
// sitemap are generated from TOOLS, so adding a page = one entry here + the
// page file.

export const SITE = {
  url: 'https://tools.luci-studio.com',
  name: 'Luci Tools',
} as const;

export interface ToolMeta {
  /** kebab-case keyword slug, e.g. `bold-text-generator` */
  slug: string;
  /** card title on the hub + nav label */
  title: string;
  /** meta description for the page */
  description: string;
  /** the single <h1> for the page */
  h1: string;
  /** icon name passed to <Icon> on the tool page badge */
  icon: string;
}

export const TOOLS: ToolMeta[] = [
  {
    slug: 'bold-text-generator',
    title: 'Bold Text Generator',
    h1: 'Bold Text Generator',
    description:
      'Turn plain text into 𝗯𝗼𝗹𝗱 Unicode you can paste into Instagram, TikTok and Twitter bios. Free, instant and 100% in your browser.',
    icon: 'bold',
  },
  {
    slug: 'italic-text-generator',
    title: 'Italic Text Generator',
    h1: 'Italic Text Generator',
    description:
      'Convert text into 𝘪𝘵𝘢𝘭𝘪𝘤 Unicode that copies and pastes anywhere — bios, captions, usernames. Free, instant and fully client-side.',
    icon: 'italic',
  },
  {
    slug: 'strikethrough-text-generator',
    title: 'Strikethrough Text Generator',
    h1: 'Strikethrough Text Generator',
    description:
      'Add a s̶t̶r̶i̶k̶e̶t̶h̶r̶o̶u̶g̶h̶ line through your text and paste it into chats, posts and bios. Free, instant and runs entirely in your browser.',
    icon: 'strikethrough',
  },
];

/** Base-aware, trailing-slash URL for a tool slug (e.g. `/fancy-text/bold-text-generator/`). */
export function toolUrl(slug: string): string {
  return `${import.meta.env.BASE_URL}${slug}/`;
}
