/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ['./src/**/*.{astro,html,js,ts,jsx,tsx,md,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans Variable"', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono Variable"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        // Brand indigo, sampled from the "Refined Indigo" design.
        // `tint`/`ring` are the soft fills used by icon tiles, trust chips and
        // the active mockup tile; `dark` is the hover/darker shade.
        brand: {
          DEFAULT: '#4f46e5',
          dark: '#4338ca',
          light: '#818cf8',
          tint: '#eef0fe',
          ring: '#e0e2fb',
        },
      },
    },
  },
  plugins: [],
};
