// Site-wide constants + this engine's tool registry. The hub page and the
// sitemap are generated from TOOLS, so adding a page = one entry here + the
// page file.

export const SITE = {
  url: 'https://tools.luci-studio.com',
  name: 'Luci Tools',
} as const;

export interface ToolMeta {
  /** kebab-case keyword slug, e.g. `password-generator` */
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
    slug: 'password-generator',
    title: 'Password Generator',
    h1: 'Password Generator',
    icon: 'lock',
    description:
      'Generate strong, random passwords in your browser — free, instant and private. Nothing is uploaded; every password is created on your device.',
  },
  {
    slug: 'strong-password-generator',
    title: 'Strong Password Generator',
    h1: 'Strong Password Generator',
    icon: 'lock',
    description:
      'Create long, high-entropy passwords built to resist cracking attempts, generated entirely in your browser with a live strength meter.',
  },
  {
    slug: 'passphrase-generator',
    title: 'Passphrase Generator',
    h1: 'Passphrase Generator',
    icon: 'lock',
    description:
      'Generate memorable, secure passphrases from random words — easier to type and recall than a jumble of symbols, created 100% on your device.',
  },
];

/** Base-aware, trailing-slash URL for a tool slug (e.g. `/password/password-generator/`). */
export function toolUrl(slug: string): string {
  return `${import.meta.env.BASE_URL}${slug}/`;
}
