import { useState } from "react";

// Parse *...*  markers and return an array of strings + <em> elements.
// Avoids dangerouslySetInnerHTML while still rendering italics as real DOM nodes.
function renderCitation(text) {
  const parts = text.split(/\*([^*]+)\*/);
  return parts.map((part, i) =>
    i % 2 === 1 ? <em key={i}>{part}</em> : part
  );
}

// Strip *...*  markers for plain-text clipboard. Word/Docs plain-text paste gets
// the citation without any asterisks — just clean prose.
function toPlainText(text) {
  return text.replace(/\*([^*]+)\*/g, "$1");
}

// Convert *...* to <i> tags for rich-text clipboard. Entities are escaped first so
// title/author text containing < or & doesn't break the HTML fragment.
// The inline style produces a hanging indent that Word/Google Docs both respect.
function toHtmlCitation(text) {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*([^*]+)\*/g, "<i>$1</i>");
  return `<p style="text-indent:-2em;padding-left:2em;margin:0">${escaped}</p>`;
}

export default function CitationBox({ citation, isLoading }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!citation) return;
    try {
      // ClipboardItem lets us write both plain text and HTML in one operation.
      // Pasting into Word or Google Docs picks the richest format they accept,
      // preserving the italics and hanging indent. Falls back to plain text when
      // ClipboardItem is unavailable (some browser contexts and older extensions).
      if (typeof ClipboardItem !== "undefined") {
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/plain": new Blob([toPlainText(citation)], { type: "text/plain" }),
            "text/html": new Blob([toHtmlCitation(citation)], { type: "text/html" }),
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(toPlainText(citation));
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API fails if the document loses focus (e.g. DevTools open).
      // Silent failure is acceptable — the text is still selectable manually.
    }
  }

  if (isLoading || !citation) {
    return (
      <div className="flex items-center justify-center py-6 min-h-[80px]">
        <div className="w-4 h-4 border-2 border-[#E5E7EB] border-t-[#1A1A1A] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4">
      {/*
        Hanging indent: first line flush left, subsequent lines indented 2em.
        Tailwind has no hanging-indent utility so we use inline styles.
        select-all lets the user click once to select all text as a Copy fallback.
      */}
      <p
        className="text-[13px] text-[#374151] leading-[1.6] mb-4 select-all"
        style={{ textIndent: "-2em", paddingLeft: "2em", overflowWrap: "break-word" }}
      >
        {renderCitation(citation)}
      </p>
      <div className="flex justify-end">
        <button
          onClick={handleCopy}
          className={[
            "text-sm font-semibold px-5 py-1.5 rounded-full transition-colors",
            copied
              ? "bg-[#374151] text-white"
              : "bg-[#1A1A1A] text-white hover:bg-[#374151]",
          ].join(" ")}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}
