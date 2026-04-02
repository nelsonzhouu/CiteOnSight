import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // jsdom gives tests a fake browser environment (document, window, etc.)
    // without this, DOM APIs would be undefined in the test runner
    environment: "jsdom",
  },
});
