// Thin wrappers around chrome.storage.local.
// Guard against chrome being undefined (jsdom in tests, non-extension contexts)
// so callers never need try/catch around storage operations.

export async function loadStorage(key) {
  if (typeof chrome === "undefined" || !chrome.storage) return null;
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (result) => resolve(result[key] ?? null));
  });
}

export function saveStorage(key, value) {
  if (typeof chrome === "undefined" || !chrome.storage) return;
  chrome.storage.local.set({ [key]: value });
}

export function clearStorage(key) {
  if (typeof chrome === "undefined" || !chrome.storage) return;
  chrome.storage.local.remove(key);
}
