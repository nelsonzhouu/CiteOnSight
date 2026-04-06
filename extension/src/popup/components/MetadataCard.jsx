const TYPE_LABELS = {
  website: "Website",
  journal_article: "Journal Article",
};

export default function MetadataCard({ metadata }) {
  const typeLabel = TYPE_LABELS[metadata.type] ?? "Website";
  const hasPublisher =
    metadata.publisher && metadata.publisher !== "Unknown Publisher";

  return (
    <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-sm p-4">
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-[#1A1A1A] text-white tracking-wide uppercase">
          {typeLabel}
        </span>
        {metadata.date !== "n.d." && (
          <span className="text-xs text-[#6B7280] shrink-0 pt-0.5">{metadata.date}</span>
        )}
      </div>

      {/* line-clamp-2 truncates titles that are too long for the popup width */}
      <p className="text-sm font-semibold text-[#1A1A1A] leading-snug line-clamp-2 mb-1.5">
        {metadata.title}
      </p>

      <p className="text-[13px] text-[#6B7280] leading-relaxed">
        {metadata.author}
        {hasPublisher && <span className="mx-1 text-[#D1D5DB]">·</span>}
        {hasPublisher && metadata.publisher}
      </p>
    </div>
  );
}
