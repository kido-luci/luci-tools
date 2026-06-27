/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "media",
  content: ['./src/**/*.{astro,html,js,ts,jsx,tsx,md,mdx}'],
  theme: {
    extend: {
      colors: {
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
