import { useState, useEffect, useRef } from "react";
import { useMetadata } from "./hooks/useMetadata.js";
import { formatCitation, CITATION_FORMATS } from "./services/mockCitationService.js";
import { loadStorage, saveStorage } from "./services/storage.js";
import MetadataCard from "./components/MetadataCard.jsx";
import FormatTabs from "./components/FormatTabs.jsx";
import CitationBox from "./components/CitationBox.jsx";
import LoadingSpinner from "./components/LoadingSpinner.jsx";
import ErrorMessage from "./components/ErrorMessage.jsx";
import ManualEntryForm from "./components/ManualEntryForm.jsx";

export default function App() {
  const { metadata, status, errorType } = useMetadata();
  const [selectedFormat, setSelectedFormat] = useState("APA");
  const [citation, setCitation] = useState(null);
  const [citationLoading, setCitationLoading] = useState(false);

  // "auto" shows the auto-extraction view; "manual" shows ManualEntryForm
  const [view, setView] = useState("auto");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Restore view from last session so users don't lose their place when the popup
  // closes and reopens (e.g., while copying a title from the page)
  useEffect(() => {
    loadStorage("view").then((saved) => {
      if (saved === "manual") setView("manual");
    });
  }, []);

  // Persist view so the next open restores the same view
  useEffect(() => {
    saveStorage("view", view);
  }, [view]);

  // Re-format whenever metadata loads or the user switches formats.
  // Using a cancelled flag prevents a stale async result from overwriting
  // a newer one if the user switches formats quickly.
  useEffect(() => {
    if (status !== "success" || !metadata) return;

    let cancelled = false;
    setCitationLoading(true);
    setCitation(null);

    formatCitation(metadata, selectedFormat)
      .then((result) => {
        if (!cancelled) {
          setCitation(result);
          setCitationLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setCitationLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [metadata, selectedFormat, status]);

  // Close the dropdown when the user clicks anywhere outside it
  useEffect(() => {
    if (!menuOpen) return;
    function handleOutsideClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [menuOpen]);

  function openManualView() {
    setMenuOpen(false);
    setView("manual");
  }

  return (
    // Chrome popup width is driven by content — fix it here so layout is predictable
    <div className="w-[380px] bg-surface font-sans">
      <header className="flex items-center gap-2.5 px-4 py-3.5 bg-white border-b border-[#E5E7EB]">
        <img src="icons/icon48.png" alt="" className="w-5 h-5 shrink-0" />
        <span className="text-base font-semibold text-[#1A1A1A] tracking-tight flex-1">
          CiteOnSight
        </span>

        {/* Hamburger menu — ref wraps button + dropdown so outside-click only fires outside both */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Menu"
            className="p-1 rounded text-[#6B7280] hover:text-[#1A1A1A] hover:bg-[#F3F4F6] transition-colors"
          >
            {/* Three horizontal bars drawn as SVG rects */}
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <rect x="2" y="3.5" width="14" height="1.5" rx="0.75" fill="currentColor" />
              <rect x="2" y="8.25" width="14" height="1.5" rx="0.75" fill="currentColor" />
              <rect x="2" y="13" width="14" height="1.5" rx="0.75" fill="currentColor" />
            </svg>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg border border-[#E5E7EB] shadow-lg py-1 z-10">
              <button
                onClick={openManualView}
                className="w-full text-left px-4 py-2 text-sm text-[#1A1A1A] hover:bg-[#F3F4F6] transition-colors"
              >
                Manual Citation
              </button>
              {/* Disabled until Phase 6 — tooltip explains why */}
              <button
                disabled
                title="Coming in Phase 6"
                className="w-full text-left px-4 py-2 text-sm text-[#9CA3AF] cursor-not-allowed"
              >
                My Projects
              </button>
            </div>
          )}
        </div>
      </header>

      {view === "manual" ? (
        <ManualEntryForm onBack={() => setView("auto")} />
      ) : (
        <div className="p-4 flex flex-col gap-3">
          {status === "loading" && <LoadingSpinner />}

          {status === "error" && <ErrorMessage errorType={errorType} />}

          {status === "success" && metadata && (
            <>
              <MetadataCard metadata={metadata} />
              <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-sm overflow-hidden">
                <FormatTabs
                  formats={CITATION_FORMATS}
                  selected={selectedFormat}
                  onChange={setSelectedFormat}
                />
                <CitationBox citation={citation} isLoading={citationLoading} />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
