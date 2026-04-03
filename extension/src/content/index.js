import { extractMetadata } from "../utils/extractMetadata.js";

// Log on load for debugging during development
const metadata = extractMetadata();
console.log("[CiteOnSight]", metadata);

// Respond to metadata requests from the popup.
// The popup can't access the DOM directly — it lives in a separate JS context.
// When the popup opens, it sends GET_METADATA and we reply with the extracted data.
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "GET_METADATA") {
    sendResponse(extractMetadata());
  }
  // Returning false means we're responding synchronously (no async work needed)
  return false;
});
