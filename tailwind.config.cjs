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
        // Engine accent — fuchsia. `tint`/`ring` are soft fills; `dark` is hover shade.
        brand: {
          DEFAULT: '#c026d3',
          dark: '#a21caf',
          light: '#e879f9',
          tint: '#fdf4ff',
          ring: '#f5d0fe',
        },
      },
    },
  },
  plugins: [],
};
