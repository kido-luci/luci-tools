// Site-wide constants + this engine's tool registry. The hub page and the
// sitemap are generated from TOOLS, so adding a page = one entry here + the
// page file.

export const SITE = {
  url: 'https://tools.luci-studio.com',
  name: 'Luci Tools',
} as const;

export interface ToolMeta {
  /** kebab-case keyword slug, e.g. `hex-to-rgb` */
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
    slug: 'hex-to-rgb',
    title: 'HEX to RGB',
    h1: 'HEX to RGB Converter',
    icon: 'sparkle',
    description:
      'Convert HEX color codes to RGB values instantly in your browser. Paste a hex code and get the red, green and blue channels — free and private.',
  },
  {
    slug: 'rgb-to-hex',
    title: 'RGB to HEX',
    h1: 'RGB to HEX Converter',
    icon: 'sparkle',
    description:
      'Convert RGB values to a HEX color code instantly in your browser. Enter red, green and blue and get the matching hex string — free and private.',
  },
  {
    slug: 'hex-to-hsl',
    title: 'HEX to HSL',
    h1: 'HEX to HSL Converter',
    icon: 'sparkle',
    description:
      'Convert HEX color codes to HSL (hue, saturation, lightness) instantly in your browser. Free, private and nothing is ever uploaded.',
  },
  {
    slug: 'color-contrast-checker',
    title: 'Color Contrast Checker',
    h1: 'Color Contrast Checker',
    icon: 'check',
    description:
      'Check the WCAG contrast ratio between two colors and see if they pass AA or AAA accessibility levels — free, instant and fully client-side.',
  },
];

/** Base-aware, trailing-slash URL for a tool slug (e.g. `/color/hex-to-rgb/`). */
export function toolUrl(slug: string): string {
  return `${import.meta.env.BASE_URL}${slug}/`;
}
