import { useState, useEffect } from "react";
import { formatCitation, CITATION_FORMATS } from "../services/mockCitationService.js";
import { loadStorage, saveStorage, clearStorage } from "../services/storage.js";
import FormatTabs from "./FormatTabs.jsx";
import CitationBox from "./CitationBox.jsx";

const SOURCE_TYPES = ["website", "journal_article", "book"];
const SOURCE_LABELS = { website: "Website", journal_article: "Journal Article", book: "Book" };

// Reusable label+input pair used throughout the form.
// Derives an id from the label text so the htmlFor/id association works for
// accessibility and for getByLabelText in tests.
function Field({ label, value, onChange, placeholder = "" }) {
  const id = label
    .replace(/[^a-zA-Z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-[#6B7280] mb-1">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#1A1A1A] transition-colors"
      />
    </div>
  );
}

// Build the metadata object that formatCitation() expects from the form state.
// Mirrors the shape produced by extractMetadata.js for websites and journal articles.
function buildMetadata(sourceType, fields) {
  const { title, authorStr, date, publisher, url, accessDate, journalName, volume, issue, pages, doi, edition, publisherLocation } =
    fields;
  const base = {
    type: sourceType,
    title: title.trim(),
    author: authorStr,
    date: date.trim() || "n.d.",
    publisher: publisher.trim() || "Unknown Publisher",
    url: url.trim(),
    // Fall back to today if the user left this blank, matching auto-extraction behavior
    accessDate: accessDate?.trim() || new Date().toISOString().split("T")[0],
  };
  if (sourceType === "journal_article") {
    return {
      ...base,
      journalName: journalName.trim(),
      volume: volume.trim(),
      issue: issue.trim(),
      pages: pages.trim(),
      doi: doi.trim(),
    };
  }
  if (sourceType === "book") {
    return { ...base, edition: edition.trim(), publisherLocation: publisherLocation.trim() };
  }
  return base;
}

export default function ManualEntryForm({ onBack }) {
  const [sourceType, setSourceType] = useState("website");
  const [selectedFormat, setSelectedFormat] = useState("APA");
  const [citation, setCitation] = useState(null);
  const [citationLoading, setCitationLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [authors, setAuthors] = useState([""]);
  const [date, setDate] = useState("");
  const [accessDate, setAccessDate] = useState("");
  const [publisher, setPublisher] = useState("");
  const [url, setUrl] = useState("");
  const [journalName, setJournalName] = useState("");
  const [volume, setVolume] = useState("");
  const [issue, setIssue] = useState("");
  const [pages, setPages] = useState("");
  const [doi, setDoi] = useState("");
  const [edition, setEdition] = useState("");
  const [publisherLocation, setPublisherLocation] = useState("");

  // Restore form state from the previous session on mount.
  // This runs once so users can close the popup (to copy a title from the page)
  // and reopen it with their in-progress fields intact.
  useEffect(() => {
    loadStorage("manualForm").then((saved) => {
      if (!saved) return;
      if (saved.sourceType) setSourceType(saved.sourceType);
      if (saved.selectedFormat) setSelectedFormat(saved.selectedFormat);
      if (saved.title !== undefined) setTitle(saved.title);
      if (saved.authors?.length) setAuthors(saved.authors);
      if (saved.date !== undefined) setDate(saved.date);
      if (saved.accessDate !== undefined) setAccessDate(saved.accessDate);
      if (saved.publisher !== undefined) setPublisher(saved.publisher);
      if (saved.url !== undefined) setUrl(saved.url);
      if (saved.journalName !== undefined) setJournalName(saved.journalName);
      if (saved.volume !== undefined) setVolume(saved.volume);
      if (saved.issue !== undefined) setIssue(saved.issue);
      if (saved.pages !== undefined) setPages(saved.pages);
      if (saved.doi !== undefined) setDoi(saved.doi);
      if (saved.edition !== undefined) setEdition(saved.edition);
      if (saved.publisherLocation !== undefined) setPublisherLocation(saved.publisherLocation);
    });
  }, []);

  // Debounced save: write all form state to storage 300ms after the last change.
  // Keeps the popup's state recoverable even when the user closes it mid-entry.
  // 300ms batches rapid keystrokes while still capturing state before popup close.
  useEffect(() => {
    const timer = setTimeout(() => {
      saveStorage("manualForm", {
        sourceType, title, authors, date, accessDate, publisher, url,
        journalName, volume, issue, pages, doi, edition, publisherLocation, selectedFormat,
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [sourceType, title, authors, date, accessDate, publisher, url, journalName, volume, issue, pages, doi, edition, publisherLocation, selectedFormat]);

  function resetFields() {
    setTitle("");
    setAuthors([""]);
    setDate("");
    setAccessDate("");
    setPublisher("");
    setUrl("");
    setJournalName("");
    setVolume("");
    setIssue("");
    setPages("");
    setDoi("");
    setEdition("");
    setPublisherLocation("");
    setCitation(null);
    setCitationLoading(false);
  }

  function handleReset() {
    resetFields();
    clearStorage("manualForm");
  }

  function handleSourceTypeChange(type) {
    setSourceType(type);
    resetFields();
  }

  function addAuthor() {
    setAuthors((prev) => [...prev, ""]);
  }

  function removeAuthor(idx) {
    if (authors.length > 1) {
      setAuthors((prev) => prev.filter((_, i) => i !== idx));
    }
  }

  function updateAuthor(idx, val) {
    setAuthors((prev) => prev.map((a, i) => (i === idx ? val : a)));
  }

  // Live preview: re-format on every field change, but skip if title is empty.
  // Uses the same cancellation pattern as App.jsx to prevent stale results.
  useEffect(() => {
    if (!title.trim()) {
      setCitation(null);
      setCitationLoading(false);
      return;
    }

    const authorStr =
      authors.filter((a) => a.trim()).join(" | ") || "Unknown Author";
    const metadata = buildMetadata(sourceType, {
      title,
      authorStr,
      date,
      accessDate,
      publisher,
      url,
      journalName,
      volume,
      issue,
      pages,
      doi,
      edition,
      publisherLocation,
    });

    let cancelled = false;
    setCitationLoading(true);

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
  }, [title, authors, date, accessDate, publisher, url, journalName, volume, issue, pages, doi, edition, sourceType, selectedFormat]);

  return (
    <div className="p-4 flex flex-col gap-3">
      {/* Back link */}
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-[#6B7280] hover:text-[#1A1A1A] transition-colors self-start"
      >
        ← Back
      </button>

      {/* Form card */}
      <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-sm p-4 flex flex-col gap-4">
        {/* Source type selector */}
        <div className="flex gap-2">
          {SOURCE_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => handleSourceTypeChange(type)}
              className={[
                "flex-1 text-xs font-semibold py-1.5 rounded-full border transition-colors",
                sourceType === type
                  ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                  : "bg-white text-[#6B7280] border-[#E5E7EB] hover:border-[#1A1A1A] hover:text-[#1A1A1A]",
              ].join(" ")}
            >
              {SOURCE_LABELS[type]}
            </button>
          ))}
        </div>

        {/* Title — required; preview is gated on this field */}
        <Field label="Title *" value={title} onChange={setTitle} />

        {/* Authors — one input per author, add/remove */}
        <div>
          <label className="block text-xs font-medium text-[#6B7280] mb-1">Authors</label>
          <div className="flex flex-col gap-1.5">
            {authors.map((author, idx) => (
              <div key={idx} className="flex gap-1.5 items-center">
                <input
                  type="text"
                  value={author}
                  onChange={(e) => updateAuthor(idx, e.target.value)}
                  placeholder="Any name format"
                  className="flex-1 px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#1A1A1A] transition-colors"
                />
                {authors.length > 1 && (
                  <button
                    onClick={() => removeAuthor(idx)}
                    aria-label="Remove author"
                    className="text-[#9CA3AF] hover:text-[#374151] text-xl leading-none px-1 transition-colors"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={addAuthor}
            className="mt-2 text-xs text-[#6B7280] hover:text-[#1A1A1A] transition-colors"
          >
            + Add author
          </button>
        </div>

        {/* Website fields */}
        {sourceType === "website" && (
          <>
            <Field
              label="Date"
              value={date}
              onChange={setDate}
              placeholder="YYYY-MM-DD"
            />
            <Field
              label="Access Date"
              value={accessDate}
              onChange={setAccessDate}
              placeholder="YYYY-MM-DD (defaults to today)"
            />
            <Field label="Publisher / Site Name" value={publisher} onChange={setPublisher} />
            <Field label="URL" value={url} onChange={setUrl} />
          </>
        )}

        {/* Journal article fields */}
        {sourceType === "journal_article" && (
          <>
            <Field label="Journal Name" value={journalName} onChange={setJournalName} />
            <Field
              label="Date"
              value={date}
              onChange={setDate}
              placeholder="YYYY-MM-DD"
            />
            <div className="grid grid-cols-2 gap-2">
              <Field label="Volume" value={volume} onChange={setVolume} />
              <Field label="Issue" value={issue} onChange={setIssue} />
            </div>
            <Field label="Pages" value={pages} onChange={setPages} placeholder="e.g. 1–10" />
            <Field
              label="DOI"
              value={doi}
              onChange={setDoi}
              placeholder="e.g. 10.1038/example"
            />
            <Field label="URL" value={url} onChange={setUrl} />
          </>
        )}

        {/* Book fields */}
        {sourceType === "book" && (
          <>
            <Field label="Year" value={date} onChange={setDate} placeholder="YYYY" />
            <Field label="Publisher" value={publisher} onChange={setPublisher} />
            <Field
              label="Publisher Location"
              value={publisherLocation}
              onChange={setPublisherLocation}
              placeholder="e.g. Cambridge, MA"
            />
            <Field
              label="Edition"
              value={edition}
              onChange={setEdition}
              placeholder="e.g. 3"
            />
          </>
        )}
      </div>

      {/* Clear Form — destructive action, separated from fields and preview */}
      <button
        onClick={handleReset}
        className="w-full py-2 text-sm font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
      >
        Clear Form
      </button>

      {/* Citation preview — gated on title being filled */}
      <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-sm overflow-hidden">
        <FormatTabs
          formats={CITATION_FORMATS}
          selected={selectedFormat}
          onChange={setSelectedFormat}
        />
        {title.trim() ? (
          <CitationBox citation={citation} isLoading={citationLoading} />
        ) : (
          <p className="px-4 py-5 text-[13px] text-[#9CA3AF] text-center">
            Fill in a title to preview the citation.
          </p>
        )}
      </div>
    </div>
  );
}
