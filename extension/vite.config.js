import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],

  build: {
    // Chrome extensions require separate JS bundles for each entry point.
    // A normal Vite app produces one bundle; rollupOptions lets us define multiple.
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "src/popup/index.html"),
        content: resolve(__dirname, "src/content/index.js"),
        background: resolve(__dirname, "src/background/index.js"),
      },
      output: {
        // Disable code splitting — Chrome extensions load scripts independently,
        // so shared chunks would fail to load without a module bundler on the other end.
        manualChunks: undefined,
        entryFileNames: "[name].js",
        chunkFileNames: "[name].js",
        assetFileNames: "[name].[ext]",
      },
    },

    outDir: "dist",

    // Emit source maps for easier debugging during development.
    // Set to false before submitting to the Chrome Web Store.
    sourcemap: true,
  },
});
