/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    // Added in Phase 1 of the refactor: utility files under lib/ now
    // contain literal Tailwind class strings (e.g. status badge colors in
    // lib/categories.ts). Without this entry, Tailwind's build only scans
    // app/ and components/, so any class referenced exclusively from lib/
    // gets purged from the final CSS even though it is used at runtime.
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
