export default function DonateView({ onBack }) {
  return (
    <div className="p-4 flex flex-col gap-4">
      {/* Back link */}
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-[#6B7280] hover:text-[#1A1A1A] transition-colors self-start"
      >
        ← Back
      </button>

      <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-sm p-6 flex flex-col items-center gap-4 text-center">
        <span className="text-4xl" aria-hidden="true">☕</span>

        <div className="flex flex-col gap-2">
          <h2 className="text-base font-semibold text-[#1A1A1A]">Support CiteOnSight</h2>
          <p className="text-sm text-[#6B7280] leading-relaxed">
            CiteOnSight is free and always will be. If it's saved you time tracking down
            citation formats, buying a coffee is a nice way to say thanks — and helps keep
            the project going.
          </p>
        </div>

        {/* Opens in a new tab so the popup stays open */}
        <a
          href="https://ko-fi.com/citeonsight"
          target="_blank"
          rel="noreferrer"
          className="w-full text-sm font-semibold px-5 py-2.5 rounded-full bg-[#1A1A1A] text-white hover:bg-[#374151] transition-colors"
        >
          Donate on Ko-fi ☕
        </a>

        <p className="text-xs text-[#9CA3AF]">
          No account needed — Ko-fi accepts card and PayPal.
        </p>
      </div>
    </div>
  );
}
