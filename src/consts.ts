// Site-wide constants + this engine's tool registry. The hub page and the
// sitemap are generated from TOOLS, so adding a page = one entry here + the
// page file.
import type { Dimension } from './lib/units';

export const SITE = {
  url: 'https://tools.luci-studio.com',
  name: 'Luci Tools',
} as const;

export interface ToolMeta {
  /** kebab-case keyword slug, e.g. `cm-to-inches` */
  slug: string;
  /** card title on the hub + nav label, in "X to Y" form */
  title: string;
  /** meta description for the page */
  description: string;
  /** the single <h1> for the page */
  h1: string;
  /** icon name (see Icon.astro registry) shown beside the page title */
  icon: string;
  /** which quantity this converter measures */
  dimension: Dimension;
  /** default source unit symbol, e.g. `cm` */
  from: string;
  /** default target unit symbol, e.g. `in` */
  to: string;
}

export const TOOLS: ToolMeta[] = [
  // — length —
  {
    slug: 'cm-to-inches',
    title: 'CM to Inches',
    h1: 'CM to Inches Converter',
    icon: 'convert',
    dimension: 'length',
    from: 'cm',
    to: 'in',
    description:
      'Convert centimeters to inches instantly in your browser. Divide by 2.54 — or just type a value and read the exact inch equivalent below.',
  },
  {
    slug: 'inches-to-cm',
    title: 'Inches to CM',
    h1: 'Inches to CM Converter',
    icon: 'convert',
    dimension: 'length',
    from: 'in',
    to: 'cm',
    description:
      'Convert inches to centimeters the easy way: every inch is exactly 2.54 cm. Enter a measurement and get the metric result at once.',
  },
  {
    slug: 'mm-to-inches',
    title: 'MM to Inches',
    h1: 'MM to Inches Converter',
    icon: 'convert',
    dimension: 'length',
    from: 'mm',
    to: 'in',
    description:
      'Turn millimeters into inches for tooling, printing and DIY projects. There are 25.4 mm in an inch — type any figure to convert it live.',
  },
  {
    slug: 'meters-to-feet',
    title: 'Meters to Feet',
    h1: 'Meters to Feet Converter',
    icon: 'convert',
    dimension: 'length',
    from: 'm',
    to: 'ft',
    description:
      'Convert meters to feet for height, rooms and distances. One meter is about 3.28084 feet — enter a value for an instant, precise answer.',
  },
  {
    slug: 'feet-to-meters',
    title: 'Feet to Meters',
    h1: 'Feet to Meters Converter',
    icon: 'convert',
    dimension: 'length',
    from: 'ft',
    to: 'm',
    description:
      'Convert feet to meters in a click. A foot is exactly 0.3048 m, so this tool gives you metric lengths accurate enough for any project.',
  },
  {
    slug: 'km-to-miles',
    title: 'KM to Miles',
    h1: 'KM to Miles Converter',
    icon: 'convert',
    dimension: 'length',
    from: 'km',
    to: 'mi',
    description:
      'Convert kilometers to miles for running, driving and travel. One kilometer is roughly 0.621371 miles — get the exact distance below.',
  },
  {
    slug: 'miles-to-km',
    title: 'Miles to KM',
    h1: 'Miles to KM Converter',
    icon: 'convert',
    dimension: 'length',
    from: 'mi',
    to: 'km',
    description:
      'Convert miles to kilometers instantly. Each mile equals exactly 1.609344 km, so race times and road distances translate cleanly to metric.',
  },
  // — weight —
  {
    slug: 'kg-to-lbs',
    title: 'KG to Lbs',
    h1: 'KG to Lbs Converter',
    icon: 'convert',
    dimension: 'mass',
    from: 'kg',
    to: 'lb',
    description:
      'Convert kilograms to pounds for weight, shipping and fitness. One kilogram is about 2.20462 lb — enter a figure for the pound equivalent.',
  },
  {
    slug: 'lbs-to-kg',
    title: 'Lbs to KG',
    h1: 'Lbs to KG Converter',
    icon: 'convert',
    dimension: 'mass',
    from: 'lb',
    to: 'kg',
    description:
      'Convert pounds to kilograms in your browser. A pound is exactly 0.45359237 kg, so bodyweight and parcel weights map straight to metric.',
  },
  // — temperature —
  {
    slug: 'celsius-to-fahrenheit',
    title: 'Celsius to Fahrenheit',
    h1: 'Celsius to Fahrenheit Converter',
    icon: 'convert',
    dimension: 'temperature',
    from: 'C',
    to: 'F',
    description:
      'Convert Celsius to Fahrenheit with the formula °F = °C × 9/5 + 32. Type a temperature and read the Fahrenheit value straight away.',
  },
  {
    slug: 'fahrenheit-to-celsius',
    title: 'Fahrenheit to Celsius',
    h1: 'Fahrenheit to Celsius Converter',
    icon: 'convert',
    dimension: 'temperature',
    from: 'F',
    to: 'C',
    description:
      'Convert Fahrenheit to Celsius using °C = (°F − 32) × 5/9. Enter any temperature to get the metric reading used across most of the world.',
  },
];

/** Base-aware, trailing-slash URL for a tool slug (e.g. `/unit/cm-to-inches/`). */
export function toolUrl(slug: string): string {
  return `${import.meta.env.BASE_URL}${slug}/`;
}

/** Human-readable group label per dimension, for the hub's section headings. */
export const DIMENSION_LABELS: Record<ToolMeta['dimension'], string> = {
  length: 'Length',
  mass: 'Weight',
  temperature: 'Temperature',
};
