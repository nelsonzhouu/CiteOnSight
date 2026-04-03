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
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 text-center">
      <p className="text-sm font-semibold text-gray-900 mb-1.5">{title}</p>
      <p className="text-xs text-gray-500 leading-relaxed">{body}</p>
    </div>
  );
}
