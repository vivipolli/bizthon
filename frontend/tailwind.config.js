/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#45803B",
          light: "#569c49",
          dark: "#386832",
        },
      },
    },
  },
  plugins: [],
};
