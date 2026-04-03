import { useState, useEffect } from "react";
import { useMetadata } from "./hooks/useMetadata.js";
import { formatCitation, CITATION_FORMATS } from "./services/mockCitationService.js";
import MetadataCard from "./components/MetadataCard.jsx";
import FormatTabs from "./components/FormatTabs.jsx";
import CitationBox from "./components/CitationBox.jsx";
import LoadingSpinner from "./components/LoadingSpinner.jsx";
import ErrorMessage from "./components/ErrorMessage.jsx";

export default function App() {
  const { metadata, status, errorType } = useMetadata();
  const [selectedFormat, setSelectedFormat] = useState("APA");
  const [citation, setCitation] = useState(null);
  const [citationLoading, setCitationLoading] = useState(false);

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

  return (
    // Chrome popup width is driven by content — fix it here so layout is predictable
    <div className="w-[380px] bg-surface font-sans min-h-[160px]">
      <header className="flex items-center gap-2 px-4 py-3 bg-white border-b border-gray-100">
        <img src="icons/icon48.png" alt="" className="w-5 h-5" />
        <span className="text-sm font-semibold text-gray-900 tracking-tight">
          CiteOnSight
        </span>
      </header>

      <div className="p-3 flex flex-col gap-3">
        {status === "loading" && <LoadingSpinner />}

        {status === "error" && <ErrorMessage errorType={errorType} />}

        {status === "success" && metadata && (
          <>
            <MetadataCard metadata={metadata} />
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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
    </div>
  );
}
