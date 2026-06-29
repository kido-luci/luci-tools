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
        // Engine accent — rose. `tint`/`ring` are soft fills; `dark` is hover shade.
        brand: {
          DEFAULT: '#e11d48',
          dark: '#be123c',
          light: '#fb7185',
          tint: '#fff1f2',
          ring: '#fecdd3',
        },
      },
    },
  },
  plugins: [],
};
