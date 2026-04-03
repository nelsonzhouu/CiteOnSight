export default function FormatTabs({ formats, selected, onChange }) {
  return (
    <div className="flex border-b border-gray-100">
      {formats.map((format) => (
        <button
          key={format}
          onClick={() => onChange(format)}
          className={[
            "flex-1 text-xs py-2.5 font-medium transition-colors focus:outline-none",
            selected === format
              ? "text-accent border-b-2 border-accent -mb-px"
              : "text-gray-400 hover:text-gray-600",
          ].join(" ")}
        >
          {format}
        </button>
      ))}
    </div>
  );
}
