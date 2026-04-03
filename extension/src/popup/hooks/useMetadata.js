import { useState, useEffect } from "react";

// Requests metadata from the content script running in the active tab.
// Chrome extensions have isolated JS contexts — the popup and content script
// can't call each other's functions directly. Chrome's message passing API
// bridges them: popup sends a message, content script responds with data.
export function useMetadata() {
  const [metadata, setMetadata] = useState(null);
  // 'loading' | 'success' | 'error'
  const [status, setStatus] = useState("loading");
  // 'browser_page' | 'timeout' | 'unknown'
  const [errorType, setErrorType] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchMetadata() {
      try {
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });

        // Content scripts can't run on chrome://, edge://, or about: pages.
        // Check the URL before sending a message that would silently fail.
        const url = tab?.url || "";
        if (
          url.startsWith("chrome://") ||
          url.startsWith("edge://") ||
          url.startsWith("about:") ||
          url.startsWith("chrome-extension://")
        ) {
          if (!cancelled) {
            setErrorType("browser_page");
            setStatus("error");
          }
          return;
        }

        // Race the message against a 3-second timeout.
        // The content script might not be ready if the page just loaded.
        const messagePromise = chrome.tabs.sendMessage(tab.id, {
          type: "GET_METADATA",
        });
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), 3000)
        );

        const response = await Promise.race([messagePromise, timeoutPromise]);

        if (!cancelled) {
          setMetadata(response);
          setStatus("success");
        }
      } catch (err) {
        if (!cancelled) {
          setErrorType(err.message === "timeout" ? "timeout" : "unknown");
          setStatus("error");
        }
      }
    }

    fetchMetadata();

    // Cleanup prevents state updates if the popup closes before the promise resolves
    return () => {
      cancelled = true;
    };
  }, []);

  return { metadata, status, errorType };
}
