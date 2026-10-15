
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: "#183D35",
          green: "#2D5A4C",
          cream: "#F7F4ED",
          gold: "#D9A441",
        },
      },
    },
  },
  plugins: [],
};
