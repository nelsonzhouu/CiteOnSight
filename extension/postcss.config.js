// Tells Vite's PostCSS pipeline which plugins to run on CSS files.
// Without this file, @tailwind directives are passed through unprocessed,
// producing an empty stylesheet even though the build succeeds.
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
