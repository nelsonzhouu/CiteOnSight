// TEMPORARY — Mock citation service for Phase 3 UI development.
// DELETE this file in Phase 4 when connecting to the real backend API.
// The real service has the same interface: formatCitation(metadata, format) → Promise<string>
// so swapping it out is a one-line import change in App.jsx.

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const MONTHS_ABBR = [
  "Jan.", "Feb.", "Mar.", "Apr.", "May", "June",
  "July", "Aug.", "Sept.", "Oct.", "Nov.", "Dec.",
];

// --- Date helpers ---

function parseDate(dateStr) {
  if (!dateStr || dateStr === "n.d.") return { year: null, month: null, day: null };
  const parts = dateStr.split("-");
  return {
    year: parts[0] || null,
    month: parts[1] ? parseInt(parts[1], 10) : null,
    day: parts[2] ? parseInt(parts[2], 10) : null,
  };
}

function dateYear(dateStr) {
  return parseDate(dateStr).year || "n.d.";
}

function dateApaWebsite(dateStr) {
  const { year, month, day } = parseDate(dateStr);
  if (!year) return "n.d.";
  if (!month) return year;
  const m = MONTHS[month - 1];
  return day ? `${year}, ${m} ${day}` : `${year}, ${m}`;
}

function dateMla(dateStr) {
  const { year, month, day } = parseDate(dateStr);
  if (!year) return "";
  if (!month) return year;
  const m = MONTHS_ABBR[month - 1];
  return day ? `${day} ${m} ${year}` : `${m} ${year}`;
}

function dateChicago(dateStr) {
  const { year, month, day } = parseDate(dateStr);
  if (!year) return "n.d.";
  if (!month) return year;
  const m = MONTHS[month - 1];
  return day ? `${m} ${day}, ${year}` : `${m} ${year}`;
}

// Harvard accessed date: "3 April 2026" (day before full month name)
function dateHarvardAccessed(dateStr) {
  const { year, month, day } = parseDate(dateStr);
  if (!year) return "";
  if (!month) return year;
  const m = MONTHS[month - 1];
  return day ? `${day} ${m} ${year}` : `${m} ${year}`;
}

// --- Author parsing ---

// Split an author string into individual name strings.
// extractMetadata.js joins multiple authors with " | " to avoid ambiguity —
// citation_author tags use "Last, F." format and "," would be ambiguous.
// Falls back to comma-splitting (with uppercase+lowercase lookahead) for plain
// "First Last, First Last" strings from other sources like JSON-LD.
function parseAuthorList(authorStr) {
  if (!authorStr || authorStr === "Unknown Author") return [];
  if (authorStr.includes(" | ")) {
    return authorStr.split(" | ").map((s) => s.trim()).filter(Boolean);
  }
  // Legacy fallback: only split at ", Name" where Name starts with uppercase+lowercase
  // so initials like "Smith, J." are NOT treated as separate authors.
  return authorStr.split(/, (?=[A-Z][a-z])/).map((s) => s.trim()).filter(Boolean);
}

// Parse a single name into { first, last }.
// Handles both "First Last" (no comma) and "Last, First" (comma present) formats.
// citation_author tags commonly use "Last, F. M." — the comma is the signal.
function parseName(nameStr) {
  const trimmed = nameStr.trim();
  if (trimmed.includes(",")) {
    const commaIdx = trimmed.indexOf(",");
    const last = trimmed.slice(0, commaIdx).trim();
    const first = trimmed.slice(commaIdx + 1).trim();
    return { first, last };
  }
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { first: "", last: parts[0] };
  const last = parts[parts.length - 1];
  const first = parts.slice(0, -1).join(" ");
  return { first, last };
}

// Convert a first-name string to dot-separated initials.
// Already-formatted initials ("P. C.") pass through unchanged.
// Full names ("Jane Marie") become "J. M.".
function toInitials(firstName) {
  if (!firstName) return "";
  return firstName
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => (part.endsWith(".") ? part : `${part[0]}.`))
    .join(" ");
}

// --- Author formatters ---
// Each returns null when there are no authors (signals "no author" to the formatter).

// APA: "Last, F." format, "&" before last.
// Websites and journals share the same rule: 1-20 list all; 21+ first 19 + "..." + last.
function authorsApa(authorStr) {
  const authors = parseAuthorList(authorStr);
  if (authors.length === 0) return null;
  const fmt = (name) => {
    const { last, first } = parseName(name);
    const initials = toInitials(first);
    return initials ? `${last}, ${initials}` : last;
  };
  const formatted = authors.map(fmt);
  if (formatted.length === 1) return formatted[0];
  if (formatted.length <= 20) {
    return formatted.slice(0, -1).join(", ") + ", & " + formatted[formatted.length - 1];
  }
  // 21+ authors: first 19, ellipsis, last author (no ampersand per APA 7)
  return formatted.slice(0, 19).join(", ") + ", ... " + formatted[formatted.length - 1];
}

// MLA website: "Last, First, and First Last, and First Last" — list all, no et al. threshold.
function authorsMlaWebsite(authorStr) {
  const authors = parseAuthorList(authorStr);
  if (authors.length === 0) return null;
  const { first: f0, last: l0 } = parseName(authors[0]);
  const first = f0 ? `${l0}, ${f0}` : l0;
  if (authors.length === 1) return first;
  const rest = authors.slice(1).map((name) => {
    const { first, last } = parseName(name);
    return first ? `${first} ${last}` : last;
  });
  if (rest.length === 1) return `${first}, and ${rest[0]}`;
  return `${first}, ${rest.slice(0, -1).join(", ")}, and ${rest[rest.length - 1]}`;
}

// MLA journal: 1-2 list all; 3+ first author + "et al."
function authorsMlaJournal(authorStr) {
  const authors = parseAuthorList(authorStr);
  if (authors.length === 0) return null;
  const { first: f0, last: l0 } = parseName(authors[0]);
  const first = f0 ? `${l0}, ${f0}` : l0;
  if (authors.length === 1) return first;
  if (authors.length >= 3) return `${first}, et al.`;
  const { first: f1, last: l1 } = parseName(authors[1]);
  return `${first}, and ${f1 ? `${f1} ${l1}` : l1}`;
}

// Chicago website: 1-10 list all with "and"; 11+ first 10 + "et al."
function authorsChicagoWebsite(authorStr) {
  const authors = parseAuthorList(authorStr);
  if (authors.length === 0) return null;
  const { first: f0, last: l0 } = parseName(authors[0]);
  const first = f0 ? `${l0}, ${f0}` : l0;
  if (authors.length === 1) return first;
  if (authors.length > 10) {
    const rest = authors.slice(1, 10).map((name) => {
      const { first, last } = parseName(name);
      return first ? `${first} ${last}` : last;
    });
    return `${first}, ${rest.join(", ")}, et al.`;
  }
  const rest = authors.slice(1).map((name) => {
    const { first, last } = parseName(name);
    return first ? `${first} ${last}` : last;
  });
  if (rest.length === 1) return `${first}, and ${rest[0]}`;
  return `${first}, ${rest.slice(0, -1).join(", ")}, and ${rest[rest.length - 1]}`;
}

// Chicago journal: 1-10 list all with "and"; 11+ first 7 + "et al."
function authorsChicagoJournal(authorStr) {
  const authors = parseAuthorList(authorStr);
  if (authors.length === 0) return null;
  const { first: f0, last: l0 } = parseName(authors[0]);
  const first = f0 ? `${l0}, ${f0}` : l0;
  if (authors.length === 1) return first;
  if (authors.length > 10) {
    // Show 7 total: first author + 6 more
    const rest = authors.slice(1, 7).map((name) => {
      const { first, last } = parseName(name);
      return first ? `${first} ${last}` : last;
    });
    return `${first}, ${rest.join(", ")}, et al.`;
  }
  const rest = authors.slice(1).map((name) => {
    const { first, last } = parseName(name);
    return first ? `${first} ${last}` : last;
  });
  if (rest.length === 1) return `${first}, and ${rest[0]}`;
  return `${first}, ${rest.slice(0, -1).join(", ")}, and ${rest[rest.length - 1]}`;
}

// IEEE: "F. Last" format, "and" before last. 1-6 list all; 7+ first author + "et al."
function authorsIeee(authorStr) {
  const authors = parseAuthorList(authorStr);
  if (authors.length === 0) return null;
  const fmt = (name) => {
    const { last, first } = parseName(name);
    const initials = toInitials(first);
    return initials ? `${initials} ${last}` : last;
  };
  if (authors.length > 6) return `${fmt(authors[0])} et al.`;
  const formatted = authors.map(fmt);
  if (formatted.length === 1) return formatted[0];
  if (formatted.length === 2) return `${formatted[0]} and ${formatted[1]}`;
  return formatted.slice(0, -1).join(", ") + ", and " + formatted[formatted.length - 1];
}

// Harvard: "Last, F." format, "and" between. 1-3 list all; 4+ first author + "et al."
function authorsHarvard(authorStr) {
  const authors = parseAuthorList(authorStr);
  if (authors.length === 0) return null;
  const fmt = (name) => {
    const { last, first } = parseName(name);
    const initials = toInitials(first);
    return initials ? `${last}, ${initials}` : last;
  };
  if (authors.length > 3) return `${fmt(authors[0])} et al.`;
  const formatted = authors.map(fmt);
  if (formatted.length === 1) return formatted[0];
  if (formatted.length === 2) return `${formatted[0]} and ${formatted[1]}`;
  return `${formatted[0]}, ${formatted[1]} and ${formatted[2]}`;
}

// --- Title cleanup ---

// Some sites append " - Journal Name" to the page title. Strip it for journal articles.
function cleanJournalTitle(title, journalName) {
  if (!title) return title;
  if (journalName) {
    const suffix = ` - ${journalName}`;
    if (title.endsWith(suffix)) return title.slice(0, -suffix.length).trim();
  }
  // Generic: strip any trailing " - Site Name" pattern (space + dash + space + text)
  return title.replace(/ [-–] [^-–]+$/, "").trim() || title;
}

// --- Citation format functions ---

function formatApa(metadata) {
  const authorFmt = authorsApa(metadata.author);
  const author = authorFmt ? `${authorFmt} ` : "";

  if (metadata.type === "journal_article") {
    const title = cleanJournalTitle(metadata.title, metadata.journalName);
    // APA: journal name italicized; volume NOT italicized
    const journal = metadata.journalName ? ` *${metadata.journalName}*` : "";
    const vol = metadata.volume ? `, ${metadata.volume}` : "";
    const issue = metadata.issue ? `(${metadata.issue})` : "";
    const pages = metadata.pages ? `, ${metadata.pages}` : "";
    const doi = metadata.doi
      ? ` https://doi.org/${metadata.doi}`
      : metadata.url ? ` ${metadata.url}` : "";
    return `${author}(${dateYear(metadata.date)}). ${title}.${journal}${vol}${issue}${pages}.${doi}`.trim();
  }

  // APA website: title italicized
  const pub = metadata.publisher !== "Unknown Publisher" ? ` ${metadata.publisher}.` : "";
  return `${author}(${dateApaWebsite(metadata.date)}). *${metadata.title}*.${pub} ${metadata.url}`.trim();
}

function formatMla(metadata) {
  const isJournal = metadata.type === "journal_article";
  const authorFmt = isJournal
    ? authorsMlaJournal(metadata.author)
    : authorsMlaWebsite(metadata.author);
  // "et al." already ends with a period — don't add a second one
  const author = authorFmt
    ? (authorFmt.endsWith(".") ? `${authorFmt} ` : `${authorFmt}. `)
    : "";

  if (isJournal) {
    const title = cleanJournalTitle(metadata.title, metadata.journalName);
    // MLA journal: journal name italicized
    const journal = metadata.journalName ? ` *${metadata.journalName}*,` : "";
    const vol = metadata.volume ? ` vol. ${metadata.volume},` : "";
    const issue = metadata.issue ? ` no. ${metadata.issue},` : "";
    const pages = metadata.pages ? ` pp. ${metadata.pages},` : "";
    const doi = metadata.doi ? ` doi:${metadata.doi}.` : ".";
    return `${author}"${title}."${journal}${vol}${issue} ${dateYear(metadata.date)},${pages}${doi}`.trim();
  }

  // MLA website: publisher italicized (title stays in quotes)
  const pub = metadata.publisher !== "Unknown Publisher" ? ` *${metadata.publisher}*,` : "";
  const date = dateMla(metadata.date);
  const dateStr = date ? ` ${date},` : "";
  return `${author}"${metadata.title}."${pub}${dateStr} ${metadata.url}.`.trim();
}

function formatChicago(metadata) {
  const isJournal = metadata.type === "journal_article";
  const authorFmt = isJournal
    ? authorsChicagoJournal(metadata.author)
    : authorsChicagoWebsite(metadata.author);
  // "et al." already ends with a period — don't add a second one
  const author = authorFmt
    ? (authorFmt.endsWith(".") ? `${authorFmt} ` : `${authorFmt}. `)
    : "";

  if (isJournal) {
    const title = cleanJournalTitle(metadata.title, metadata.journalName);
    // Chicago journal: journal name italicized
    const journal = metadata.journalName ? ` *${metadata.journalName}*` : "";
    const vol = metadata.volume ? ` ${metadata.volume}` : "";
    const issue = metadata.issue ? `, no. ${metadata.issue}` : "";
    const year = `(${dateYear(metadata.date)})`;
    const pages = metadata.pages ? `: ${metadata.pages}` : "";
    const doi = metadata.doi ? ` https://doi.org/${metadata.doi}.` : ".";
    return `${author}"${title}."${journal}${vol}${issue} ${year}${pages}${doi}`.trim();
  }

  // Chicago website: no italics
  const pub = metadata.publisher !== "Unknown Publisher" ? ` ${metadata.publisher}.` : "";
  const accessed = metadata.accessDate ? ` (accessed ${dateChicago(metadata.accessDate)})` : "";
  return `${author}"${metadata.title}."${pub} ${dateChicago(metadata.date)}. ${metadata.url}${accessed}.`.trim();
}

function formatIeee(metadata) {
  const authorFmt = authorsIeee(metadata.author);
  // IEEE: author followed by comma, then title in quotes
  const author = authorFmt ? `${authorFmt}, ` : "";

  if (metadata.type === "journal_article") {
    const title = cleanJournalTitle(metadata.title, metadata.journalName);
    // IEEE journal: journal name italicized
    const journal = metadata.journalName ? ` *${metadata.journalName}*,` : "";
    const vol = metadata.volume ? ` vol. ${metadata.volume},` : "";
    const issue = metadata.issue ? ` no. ${metadata.issue},` : "";
    const pages = metadata.pages ? ` pp. ${metadata.pages},` : "";
    return `${author}"${title},"${journal}${vol}${issue}${pages} ${dateYear(metadata.date)}.`.trim();
  }

  // IEEE website: no italics
  const pub = metadata.publisher !== "Unknown Publisher" ? ` ${metadata.publisher},` : "";
  return `${author}"${metadata.title},"${pub} ${dateChicago(metadata.date)}. [Online]. Available: ${metadata.url}`.trim();
}

function formatHarvard(metadata) {
  const authorFmt = authorsHarvard(metadata.author);
  const author = authorFmt ? `${authorFmt} ` : "";

  if (metadata.type === "journal_article") {
    const title = cleanJournalTitle(metadata.title, metadata.journalName);
    // Harvard journal: journal name italicized; volume/issue NOT italicized
    // Format: *Nature*, 500(7460) — not *Nature*, *500*(7460)
    let journalRef = "";
    if (metadata.journalName) {
      journalRef = ` *${metadata.journalName}*`;
      if (metadata.volume) {
        journalRef += `, ${metadata.volume}`;
        if (metadata.issue) journalRef += `(${metadata.issue})`;
      }
      journalRef += ",";
    }
    const pages = metadata.pages ? ` pp. ${metadata.pages}.` : ".";
    return `${author}(${dateYear(metadata.date)}), '${title}',${journalRef}${pages}`.trim();
  }

  // Harvard website: no italics (title in single quotes)
  const pub = metadata.publisher !== "Unknown Publisher" ? ` ${metadata.publisher}.` : "";
  const accessed = metadata.accessDate ? ` (Accessed: ${dateHarvardAccessed(metadata.accessDate)})` : "";
  return `${author}(${dateYear(metadata.date)}), '${metadata.title}',${pub} Available at: ${metadata.url}${accessed}.`.trim();
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

export const CITATION_FORMATS = ["APA", "MLA", "Chicago", "IEEE", "Harvard"];
