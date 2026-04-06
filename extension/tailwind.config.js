/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx,html}"],
  theme: {
    extend: {
      colors: {
        // Teal-green accent: active tabs, badges, copy confirmation
        accent: {
          DEFAULT: "#10B981",
          light: "#D1FAE5",
          dark: "#059669",
        },
        // Warm creamy off-white for the popup background
        surface: "#F9F7F4",
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
