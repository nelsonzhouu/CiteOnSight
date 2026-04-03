const TYPE_LABELS = {
  website: "Website",
  journal_article: "Journal Article",
};

export default function MetadataCard({ metadata }) {
  const typeLabel = TYPE_LABELS[metadata.type] ?? "Website";
  const hasPublisher =
    metadata.publisher && metadata.publisher !== "Unknown Publisher";

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-accent-light text-accent-dark">
          {typeLabel}
        </span>
        {metadata.date !== "n.d." && (
          <span className="text-xs text-gray-400 shrink-0">{metadata.date}</span>
        )}
      </div>

      {/* line-clamp-2 truncates titles that are too long for the popup width */}
      <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 mb-1.5">
        {metadata.title}
      </p>

      <p className="text-xs text-gray-500 leading-relaxed">
        {metadata.author}
        {hasPublisher && <span className="text-gray-300"> · </span>}
        {hasPublisher && metadata.publisher}
      </p>
    </div>
  );
}
