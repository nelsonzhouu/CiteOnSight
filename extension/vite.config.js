import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],

  build: {
    rollupOptions: {
      // Chrome extensions need a separate JS bundle for each script context.
      // All three are JS entry points — popup.html lives in public/ and loads
      // popup.js at runtime, so it does not need to be an entry point here.
      input: {
        popup: resolve(__dirname, "src/popup/index.jsx"),
        content: resolve(__dirname, "src/content/index.js"),
        background: resolve(__dirname, "src/background/index.js"),
      },
      output: {
        // Disable code splitting — Chrome loads extension scripts independently,
        // so shared chunks would 404 without a module bundler on the other end.
        manualChunks: undefined,
        entryFileNames: "[name].js",
        chunkFileNames: "[name].js",
        assetFileNames: "[name].[ext]",
      },
    },

    outDir: "dist",

    // Source maps help with debugging in Chrome DevTools.
    // Disable before publishing to the Chrome Web Store.
    sourcemap: true,
  },
});
