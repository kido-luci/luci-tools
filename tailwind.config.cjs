/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{astro,html,js,ts,jsx,tsx,md,mdx}'],
  theme: {
    extend: {
      colors: {
        // Brand indigo (Option A). `tint`/`ring` are the soft fills used by
        // the icon tiles, trust chips and card hover state.
        brand: {
          DEFAULT: '#4f52d9',
          dark: '#3c40c7',
          light: '#8f93e6',
          tint: '#edeefb',
          ring: '#c7c9f2',
        },
      },
    },
  },
  plugins: [],
};
