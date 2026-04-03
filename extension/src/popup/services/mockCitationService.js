// TEMPORARY — Mock citation service for Phase 3 UI development.
// DELETE this file in Phase 4 when connecting to the real backend API.
// The real service will have the same interface: formatCitation(metadata, format) → Promise<string>
// so swapping it out is a one-line import change in App.jsx.

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const MONTHS_ABBR = [
  "Jan.", "Feb.", "Mar.", "Apr.", "May", "June",
  "July", "Aug.", "Sept.", "Oct.", "Nov.", "Dec.",
];

// Parse a YYYY-MM-DD date string into year/month/day components
function parseDate(dateStr) {
  if (!dateStr || dateStr === "n.d.") return { year: null, month: null, day: null };
  const parts = dateStr.split("-");
  return {
    year: parts[0] || null,
    month: parts[1] ? parseInt(parts[1], 10) : null,
    day: parts[2] ? parseInt(parts[2], 10) : null,
  };
}

// Parse the first author name from a "First Last, First Last" string.
// This is approximate — the real backend handles suffixes, initials, and ambiguous comma formats.
function parseFirstAuthor(authorStr) {
  if (!authorStr || authorStr === "Unknown Author") {
    return { first: "", last: "Unknown Author", initial: "" };
  }
  // Take the first name in the comma-separated list
  const firstStr = authorStr.split(", ")[0].trim();
  const parts = firstStr.split(" ");
  if (parts.length === 1) return { first: "", last: parts[0], initial: "" };
  const last = parts[parts.length - 1];
  const first = parts.slice(0, -1).join(" ");
  return { first, last, initial: first[0] || "" };
}

function countAuthors(authorStr) {
  if (!authorStr || authorStr === "Unknown Author") return 0;
  return authorStr.split(", ").length;
}

// --- Date formatters for each citation style ---

function dateYear(dateStr) {
  return parseDate(dateStr).year || "n.d.";
}

// APA website: "2024, March 15"
function dateApaWebsite(dateStr) {
  const { year, month, day } = parseDate(dateStr);
  if (!year) return "n.d.";
  if (!month) return year;
  const m = MONTHS[month - 1];
  return day ? `${year}, ${m} ${day}` : `${year}, ${m}`;
}

// MLA: "15 Mar. 2024"
function dateMla(dateStr) {
  const { year, month, day } = parseDate(dateStr);
  if (!year) return "";
  if (!month) return year;
  const m = MONTHS_ABBR[month - 1];
  return day ? `${day} ${m} ${year}` : `${m} ${year}`;
}

// Chicago/IEEE: "March 15, 2024"
function dateChicago(dateStr) {
  const { year, month, day } = parseDate(dateStr);
  if (!year) return "n.d.";
  if (!month) return year;
  const m = MONTHS[month - 1];
  return day ? `${m} ${day}, ${year}` : `${m} ${year}`;
}

// --- Citation format functions ---

function formatApa(metadata) {
  const { last, initial } = parseFirstAuthor(metadata.author);
  const n = countAuthors(metadata.author);
  const isUnknown = metadata.author === "Unknown Author";

  let author = "";
  if (!isUnknown) {
    const name = initial ? `${last}, ${initial}.` : last;
    author = n > 1 ? `${name}, et al. ` : `${name} `;
  }

  if (metadata.type === "journal_article") {
    const journal = metadata.journalName ? ` *${metadata.journalName}*` : "";
    const vol = metadata.volume ? `, *${metadata.volume}*` : "";
    const issue = metadata.issue ? `(${metadata.issue})` : "";
    const pages = metadata.pages ? `, ${metadata.pages}` : "";
    const doi = metadata.doi
      ? ` https://doi.org/${metadata.doi}`
      : metadata.url ? ` ${metadata.url}` : "";
    return `${author}(${dateYear(metadata.date)}). ${metadata.title}.${journal}${vol}${issue}${pages}.${doi}`.trim();
  }

  const pub = metadata.publisher !== "Unknown Publisher" ? ` ${metadata.publisher}.` : "";
  return `${author}(${dateApaWebsite(metadata.date)}). ${metadata.title}.${pub} ${metadata.url}`.trim();
}

function formatMla(metadata) {
  const { first, last } = parseFirstAuthor(metadata.author);
  const n = countAuthors(metadata.author);
  const isUnknown = metadata.author === "Unknown Author";

  let author = "";
  if (!isUnknown) {
    const name = first ? `${last}, ${first}` : last;
    author = n > 1 ? `${name}, et al. ` : `${name}. `;
  }

  if (metadata.type === "journal_article") {
    const journal = metadata.journalName ? ` *${metadata.journalName}*,` : "";
    const vol = metadata.volume ? ` vol. ${metadata.volume},` : "";
    const issue = metadata.issue ? ` no. ${metadata.issue},` : "";
    const pages = metadata.pages ? ` pp. ${metadata.pages},` : "";
    const doi = metadata.doi ? ` doi:${metadata.doi}.` : ".";
    return `${author}"${metadata.title}."${journal}${vol}${issue} ${dateYear(metadata.date)},${pages}${doi}`.trim();
  }

  const pub = metadata.publisher !== "Unknown Publisher" ? ` *${metadata.publisher}*,` : "";
  const date = dateMla(metadata.date);
  const dateStr = date ? ` ${date},` : "";
  return `${author}"${metadata.title}."${pub}${dateStr} ${metadata.url}.`.trim();
}

function formatChicago(metadata) {
  const { first, last } = parseFirstAuthor(metadata.author);
  const n = countAuthors(metadata.author);
  const isUnknown = metadata.author === "Unknown Author";

  let author = "";
  if (!isUnknown) {
    const name = first ? `${last}, ${first}` : last;
    author = n > 1 ? `${name} et al. ` : `${name}. `;
  }

  if (metadata.type === "journal_article") {
    const journal = metadata.journalName ? ` *${metadata.journalName}*` : "";
    const vol = metadata.volume ? ` ${metadata.volume}` : "";
    const issue = metadata.issue ? `, no. ${metadata.issue}` : "";
    const year = `(${dateYear(metadata.date)})`;
    const pages = metadata.pages ? `: ${metadata.pages}` : "";
    const doi = metadata.doi ? ` https://doi.org/${metadata.doi}.` : ".";
    return `${author}"${metadata.title}."${journal}${vol}${issue} ${year}${pages}${doi}`.trim();
  }

  const pub = metadata.publisher !== "Unknown Publisher" ? ` ${metadata.publisher}.` : "";
  return `${author}"${metadata.title}."${pub} ${dateChicago(metadata.date)}. ${metadata.url}.`.trim();
}

function formatIeee(metadata) {
  const { last, initial } = parseFirstAuthor(metadata.author);
  const n = countAuthors(metadata.author);
  const isUnknown = metadata.author === "Unknown Author";

  // IEEE author format: "F. Last"
  let author = "";
  if (!isUnknown) {
    const name = initial ? `${initial}. ${last}` : last;
    author = n > 1 ? `${name} et al., ` : `${name}, `;
  }

  if (metadata.type === "journal_article") {
    const journal = metadata.journalName ? ` *${metadata.journalName}*,` : "";
    const vol = metadata.volume ? ` vol. ${metadata.volume},` : "";
    const issue = metadata.issue ? ` no. ${metadata.issue},` : "";
    const pages = metadata.pages ? ` pp. ${metadata.pages},` : "";
    return `${author}"${metadata.title},"${journal}${vol}${issue}${pages} ${dateYear(metadata.date)}.`.trim();
  }

  const pub = metadata.publisher !== "Unknown Publisher" ? ` ${metadata.publisher},` : "";
  return `${author}"${metadata.title},"${pub} ${dateChicago(metadata.date)}. [Online]. Available: ${metadata.url}`.trim();
}

function formatHarvard(metadata) {
  const { last, initial } = parseFirstAuthor(metadata.author);
  const n = countAuthors(metadata.author);
  const isUnknown = metadata.author === "Unknown Author";

  let author = "";
  if (!isUnknown) {
    const name = initial ? `${last}, ${initial}.` : last;
    author = n > 1 ? `${name} et al. ` : `${name} `;
  }

  if (metadata.type === "journal_article") {
    const journal = metadata.journalName ? ` *${metadata.journalName}*,` : "";
    const vol = metadata.volume ? ` vol. ${metadata.volume},` : "";
    const issue = metadata.issue ? ` no. ${metadata.issue},` : "";
    const pages = metadata.pages ? ` pp. ${metadata.pages}.` : ".";
    return `${author}(${dateYear(metadata.date)}) '${metadata.title}',${journal}${vol}${issue}${pages}`.trim();
  }

  const pub = metadata.publisher !== "Unknown Publisher" ? ` ${metadata.publisher}.` : "";
  const accessed = metadata.accessDate ? dateChicago(metadata.accessDate) : "";
  return `${author}(${dateYear(metadata.date)}) *${metadata.title}*.${pub} Available at: ${metadata.url} (Accessed: ${accessed}).`.trim();
}

const FORMATTERS = {
  APA: formatApa,
  MLA: formatMla,
  Chicago: formatChicago,
  IEEE: formatIeee,
  Harvard: formatHarvard,
};

// Simulates the async nature of the real API call so the loading state renders in tests.
// The real formatCitation() in Phase 4 makes an HTTP request — this delay makes the
// mock behave the same way so no UI code needs to change when we swap services.
export async function formatCitation(metadata, format) {
  await new Promise((resolve) => setTimeout(resolve, 150));
  const formatter = FORMATTERS[format];
  if (!formatter) throw new Error(`Unknown citation format: ${format}`);
  return formatter(metadata);
}

// Export format list so components don't hardcode it
export const CITATION_FORMATS = ["APA", "MLA", "Chicago", "IEEE", "Harvard"];
