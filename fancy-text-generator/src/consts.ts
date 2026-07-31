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
  {
    slug: 'cursive-text-generator',
    title: 'Cursive Text Generator',
    h1: 'Cursive Text Generator',
    description:
      'Turn plain text into flowing 𝓬𝓾𝓻𝓼𝓲𝓿𝓮 Unicode script you can paste into Instagram, TikTok and Twitter bios. Free, instant and 100% in your browser.',
    icon: 'sparkle',
  },
  {
    slug: 'bubble-text-generator',
    title: 'Bubble Text Generator',
    h1: 'Bubble Text Generator',
    description:
      'Wrap your letters in circles to make ⓑⓤⓑⓑⓛⓔ text for bios, captions and usernames. Free, instant and runs entirely in your browser.',
    icon: 'layers',
  },
  {
    slug: 'wide-text-generator',
    title: 'Wide Text Generator',
    h1: 'Wide Text Generator',
    description:
      'Stretch text into ｗｉｄｅ, vaporwave-style fullwidth Unicode — the same aesthetic look used in retro and lofi aesthetic captions. Free and instant.',
    icon: 'convert',
  },
  {
    slug: 'monospace-text-generator',
    title: 'Monospace Text Generator',
    h1: 'Monospace Text Generator',
    description:
      'Convert text into fixed-width 𝚖𝚘𝚗𝚘𝚜𝚙𝚊𝚌𝚎 Unicode that gives bios and captions a clean, code-like look. Free, instant and fully client-side.',
    icon: 'code',
  },
  {
    slug: 'underline-text-generator',
    title: 'Underline Text Generator',
    h1: 'Underline Text Generator',
    description:
      'A̲d̲d̲ a̲ ̲l̲i̲n̲e̲ under your text with Unicode combining marks and paste it into bios, chats and posts. Free, instant and runs entirely in your browser.',
    icon: 'text',
  },
];

/** Base-aware, trailing-slash URL for a tool slug (e.g. `/fancy-text/bold-text-generator/`). */
export function toolUrl(slug: string): string {
  return `${import.meta.env.BASE_URL}${slug}/`;
}
