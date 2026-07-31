/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ['./src/**/*.{astro,html,js,ts,jsx,tsx,md,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        // Cream-paper "Luci Tools" identity: Hanken for body, Space Grotesk for
        // display headings, IBM Plex Mono for labels/chips (aligned to the blog's
        // blueprint chrome mono — see docs/strategy/studio-design-tokens.md).
        sans: ['"Hanken Grotesk Variable"', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Space Grotesk Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        // Cream-paper palette (light-only). `ink` is the near-black text; `paper`
        // is the canvas; `accent` is the private-green used for links + active state.
        ink: '#1C1A16',
        paper: '#f4f2ec',
        accent: {
          DEFAULT: '#1F7A55',
          dark: '#17603F',
        },
      },
    },
  },
  plugins: [],
};
