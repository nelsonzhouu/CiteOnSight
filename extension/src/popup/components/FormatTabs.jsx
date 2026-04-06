export default function FormatTabs({ formats, selected, onChange }) {
  return (
    <div className="flex border-b border-[#E5E7EB]">
      {formats.map((format) => (
        <button
          key={format}
          onClick={() => onChange(format)}
          className={[
            "flex-1 text-sm py-3 transition-colors focus:outline-none",
            selected === format
              ? "font-semibold text-[#1A1A1A] border-b-2 border-[#1A1A1A] -mb-px"
              : "font-medium text-[#6B7280] hover:text-[#374151]",
          ].join(" ")}
        >
          {format}
        </button>
      ))}
    </div>
  );
}
