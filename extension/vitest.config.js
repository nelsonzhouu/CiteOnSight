import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // React plugin handles JSX transformation in both app code and test files
  plugins: [react()],
  test: {
    // jsdom gives tests a fake browser environment (document, window, etc.)
    // without this, DOM APIs would be undefined in the test runner
    environment: "jsdom",
    // Makes describe/it/expect available globally so setup files (like jest-dom)
    // can call expect.extend() without needing to import expect first
    globals: true,
    // Runs before each test file — imports jest-dom matchers (toBeInTheDocument, etc.)
    setupFiles: ["./tests/setup.js"],
  },
});
