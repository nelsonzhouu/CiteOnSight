import { useState } from "react";

export default function CitationBox({ citation, isLoading }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!citation) return;
    try {
      await navigator.clipboard.writeText(citation);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API fails if the document loses focus (e.g. DevTools open).
      // Silent failure is acceptable — the text is still selectable manually.
    }
  }

  if (isLoading || !citation) {
    return (
      <div className="flex items-center justify-center p-5 min-h-[72px]">
        <div className="w-4 h-4 border-2 border-gray-200 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* select-all makes the citation text selectable in one click as a fallback to Copy */}
      <p className="text-xs text-gray-700 leading-relaxed mb-3 select-all">
        {citation}
      </p>
      <div className="flex justify-end">
        <button
          onClick={handleCopy}
          className={[
            "text-xs font-medium px-4 py-1.5 rounded-full transition-colors",
            copied
              ? "bg-accent text-white"
              : "bg-gray-900 text-white hover:bg-gray-700",
          ].join(" ")}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}
