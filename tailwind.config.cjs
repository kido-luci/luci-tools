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
        // Engine accent — orange. `tint`/`ring` are soft fills; `dark` is hover shade.
        brand: {
          DEFAULT: '#f97316',
          dark: '#ea580c',
          light: '#fdba74',
          tint: '#fff7ed',
          ring: '#fed7aa',
        },
      },
    },
  },
  plugins: [],
};
