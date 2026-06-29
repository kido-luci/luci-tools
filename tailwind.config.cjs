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
        // Engine accent — sky. `tint`/`ring` are soft fills; `dark` is hover shade.
        brand: {
          DEFAULT: '#0284c7',
          dark: '#0369a1',
          light: '#38bdf8',
          tint: '#f0f9ff',
          ring: '#bae6fd',
        },
      },
    },
  },
  plugins: [],
};
