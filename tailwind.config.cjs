/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ['./src/**/*.{astro,html,js,ts,jsx,tsx,md,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        // Cream "Luci Tools" identity, shared with the hub: Hanken body, Space
        // Grotesk display headings, IBM Plex Mono labels.
        sans: ['"Hanken Grotesk Variable"', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Space Grotesk Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        // Interactive accent (links/buttons) — the hub green; theme-aware via the var.
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
        },
        // Category identity tile — this engine's hub-card hue (same on both themes).
        tile: {
          bg: 'var(--tile-bg)',
          fg: 'var(--tile-fg)',
        },
      },
    },
  },
  plugins: [],
};
