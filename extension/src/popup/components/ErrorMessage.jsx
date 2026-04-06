const ERROR_CONTENT = {
  browser_page: {
    title: "Can't cite this page",
    body: "CiteOnSight doesn't work on browser pages. Navigate to any website or article and try again.",
  },
  timeout: {
    title: "Couldn't read this page",
    body: "The page didn't respond in time. Try refreshing and opening CiteOnSight again.",
  },
  unknown: {
    title: "Something went wrong",
    body: "CiteOnSight couldn't extract citation data from this page.",
  },
};

export default function ErrorMessage({ errorType }) {
  const { title, body } = ERROR_CONTENT[errorType] ?? ERROR_CONTENT.unknown;

  return (
    <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-sm p-5 text-center">
      <p className="text-sm font-semibold text-[#1A1A1A] mb-1.5">{title}</p>
      <p className="text-[13px] text-[#6B7280] leading-relaxed">{body}</p>
    </div>
  );
}
