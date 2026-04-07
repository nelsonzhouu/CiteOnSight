import { describe, it, expect } from "vitest";
import { loadStorage, saveStorage, clearStorage } from "../../src/popup/services/storage.js";

// chrome is not available in jsdom — these tests verify the graceful fallback behavior
describe("storage — graceful fallback without chrome", () => {
  it("loadStorage returns null when chrome is not defined", async () => {
    const result = await loadStorage("anyKey");
    expect(result).toBeNull();
  });

  it("saveStorage does not throw when chrome is not defined", () => {
    expect(() => saveStorage("anyKey", { val: 1 })).not.toThrow();
  });

  it("clearStorage does not throw when chrome is not defined", () => {
    expect(() => clearStorage("anyKey")).not.toThrow();
  });
});
