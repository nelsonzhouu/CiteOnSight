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
      <div className="flex items-center justify-center py-6 min-h-[80px]">
        <div className="w-4 h-4 border-2 border-[#E5E7EB] border-t-[#1A1A1A] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* select-all makes the citation selectable in one click as a fallback to Copy */}
      <p className="text-[13px] text-[#374151] leading-[1.6] mb-4 select-all">
        {citation}
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
