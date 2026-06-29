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
        // Engine accent — emerald. `tint`/`ring` are soft fills; `dark` is hover shade.
        brand: {
          DEFAULT: '#059669',
          dark: '#047857',
          light: '#34d399',
          tint: '#ecfdf5',
          ring: '#a7f3d0',
        },
      },
    },
  },
  plugins: [],
};
