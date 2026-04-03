/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx,html}"],
  theme: {
    extend: {
      colors: {
        // Teal-green accent used for badges, active tab indicator, copy confirmation
        accent: {
          DEFAULT: "#2A9D8F",
          light: "#E8F5F3",
          dark: "#1F7A6F",
        },
        // Warm off-white used as the popup background
        surface: "#F7F6F3",
      },
      fontFamily: {
        // System font stack — matches the clean sans-serif look in the reference
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
