// --- Low-level DOM helpers ---

function getMeta(name) {
  return document.querySelector(`meta[name="${name}"]`)?.content?.trim() || null;
}

function getMetaProperty(property) {
  return document.querySelector(`meta[property="${property}"]`)?.content?.trim() || null;
}

// Some pages list multiple values for the same meta name (e.g. citation_author for co-authors)
function getAllMeta(name) {
  return Array.from(document.querySelectorAll(`meta[name="${name}"]`))
    .map((el) => el.content?.trim())
    .filter(Boolean);
}

// Parse all JSON-LD script tags on the page into a flat list of objects.
// Returns an array so callers don't need to handle the single-vs-array ambiguity.
function parseJsonLd() {
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');
  const results = [];
  for (const script of scripts) {
    try {
      const parsed = JSON.parse(script.textContent);
      if (Array.isArray(parsed)) {
        results.push(...parsed);
      } else if (parsed && typeof parsed === "object") {
        results.push(parsed);
      }
    } catch {
      // Skip malformed JSON-LD rather than crashing — bad markup is common
    }
  }
  return results;
}

// Walk a dot-separated path through the JSON-LD list, returning the first non-null hit.
// e.g. getJsonLdValue(list, 'publisher', 'name') checks obj.publisher.name on each item.
function getJsonLdValue(jsonLdList, ...path) {
  for (const obj of jsonLdList) {
    let val = obj;
    for (const key of path) {
      val = val?.[key];
    }
    if (val) return val;
  }
  return null;
}

// --- Date normalization ---

function normalizeDate(str) {
  if (!str || typeof str !== "string") return null;
  const trimmed = str.trim();

  // Handles ISO 8601 with or without time: "2024-03-15" or "2024-03-15T09:00:00Z"
  const isoMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) return isoMatch[1];

  // Handles YYYY/MM/DD
  const slashMatch = trimmed.match(/^(\d{4})\/(\d{2})\/(\d{2})/);
  if (slashMatch) return `${slashMatch[1]}-${slashMatch[2]}-${slashMatch[3]}`;

  // Fallback for formats like "March 15, 2024" — less precise but workable
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getUTCFullYear();
    const m = String(parsed.getUTCMonth() + 1).padStart(2, "0");
    const d = String(parsed.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  return null;
}

// --- Source-specific field extractors ---

function extractDoiFromUrl() {
  // DOIs always start with "10." followed by a registrant code — this is a reliable pattern
  const match = window.location.href.match(/\b(10\.\d{4,}\/\S+)/);
  return match ? match[1] : null;
}

// --- Source type detection ---

export function detectSourceType(jsonLdList) {
  // DOI is an unambiguous signal — only academic publishers use it
  if (getMeta("citation_doi") || extractDoiFromUrl()) return "journal_article";

  // Highwire Press tags are used by Nature, PubMed, and most journal publishers
  if (getMeta("citation_journal_title")) return "journal_article";

  // ScholarlyArticle only — plain "Article" is too broad (Wikipedia uses it for every page)
  // NewsArticle excluded — news sites are websites, not academic sources
  const hasScholarlyJsonLd = jsonLdList.some((obj) => {
    const types = Array.isArray(obj["@type"]) ? obj["@type"] : [obj["@type"]];
    return types.includes("ScholarlyArticle");
  });
  if (hasScholarlyJsonLd) return "journal_article";

  return "website";
}

// --- Base field extractors (all source types) ---

function extractTitle(jsonLdList) {
  return (
    getMetaProperty("og:title") ||
    getMeta("twitter:title") ||
    // JSON-LD uses 'headline' for articles and 'name' for most other things
    getJsonLdValue(jsonLdList, "headline") ||
    getJsonLdValue(jsonLdList, "name") ||
    document.title.trim() ||
    "Unknown Title"
  );
}

function extractAuthor(jsonLdList) {
  // Try multiple selectors since sites structure metadata differently

  // Highwire tags support multiple citation_author elements for co-authorship
  const citationAuthors = getAllMeta("citation_author");
  if (citationAuthors.length > 0) return citationAuthors.join(", ");

  const authorMeta = getMeta("author");
  if (authorMeta) return authorMeta;

  // article:author follows the OG spec and is often a profile URL, not a name — skip URLs
  const articleAuthor = getMetaProperty("article:author");
  if (articleAuthor && !articleAuthor.startsWith("http")) return articleAuthor;

  // JSON-LD author can be a plain string, {name: "..."}, or an array of either
  const rawAuthor = getJsonLdValue(jsonLdList, "author");
  if (rawAuthor) {
    const authors = Array.isArray(rawAuthor) ? rawAuthor : [rawAuthor];
    const names = authors
      .map((a) => (typeof a === "string" ? a : a?.name))
      .filter(Boolean);
    if (names.length > 0) return names.join(", ");
  }

  // Some sites set the URL as the link's text content rather than the author name — skip those
  const relAuthorEls = Array.from(document.querySelectorAll('[rel="author"]'))
    .map((el) => el.textContent.trim())
    .filter((text) => text && !text.startsWith("http"));
  if (relAuthorEls.length > 0) return relAuthorEls.join(", ");

  const itempropEls = Array.from(document.querySelectorAll('[itemprop="author"]'))
    .map((el) => el.textContent.trim())
    .filter((text) => text && !text.startsWith("http"));
  if (itempropEls.length > 0) return itempropEls.join(", ");

  return "Unknown Author";
}

function extractDate(jsonLdList) {
  const candidates = [
    getMetaProperty("article:published_time"),
    getMeta("citation_date"),
    getMeta("citation_publication_date"),
    getMeta("date"),
    getMeta("pubdate"),
    getMeta("DC.date"),
    getJsonLdValue(jsonLdList, "datePublished"),
  ];

  for (const candidate of candidates) {
    const normalized = normalizeDate(candidate);
    if (normalized) return normalized;
  }

  // <time datetime="..."> is the semantic HTML standard for machine-readable dates
  const timeEl = document.querySelector("time[datetime]");
  if (timeEl) {
    const normalized = normalizeDate(timeEl.getAttribute("datetime"));
    if (normalized) return normalized;
  }

  return "n.d.";
}

function extractUrl() {
  // Prefer canonical URL — strips tracking params and points to the "official" version
  return document.querySelector('link[rel="canonical"]')?.href || window.location.href;
}

// --- Type-specific field extractors ---

function extractWebsiteFields(jsonLdList) {
  return {
    publisher:
      getMetaProperty("og:site_name") ||
      getJsonLdValue(jsonLdList, "publisher", "name") ||
      "Unknown Publisher",
  };
}

function extractJournalFields(jsonLdList) {
  // Build page range from separate first/last page tags when available
  const firstPage = getMeta("citation_firstpage");
  const lastPage = getMeta("citation_lastpage");
  let pages = null;
  if (firstPage && lastPage) {
    pages = `${firstPage}–${lastPage}`;
  } else if (firstPage) {
    pages = firstPage;
  } else {
    pages = getJsonLdValue(jsonLdList, "pagination") || null;
  }

  // JSON-LD identifier for DOIs can be a plain string or a PropertyValue object
  let doiFromJsonLd = null;
  const identifier = getJsonLdValue(jsonLdList, "identifier");
  if (identifier) {
    if (typeof identifier === "string" && identifier.startsWith("10.")) {
      doiFromJsonLd = identifier;
    } else if (
      typeof identifier === "object" &&
      identifier.propertyID === "DOI"
    ) {
      doiFromJsonLd = identifier.value;
    }
  }

  return {
    doi: getMeta("citation_doi") || extractDoiFromUrl() || doiFromJsonLd || null,
    journalName:
      getMeta("citation_journal_title") ||
      getJsonLdValue(jsonLdList, "isPartOf", "name") ||
      null,
    volume:
      getMeta("citation_volume") ||
      getJsonLdValue(jsonLdList, "volumeNumber") ||
      null,
    issue:
      getMeta("citation_issue") ||
      getJsonLdValue(jsonLdList, "issueNumber") ||
      null,
    pages,
  };
}

// --- Main export ---

export function extractMetadata() {
  const jsonLdList = parseJsonLd();
  const type = detectSourceType(jsonLdList);

  const base = {
    type,
    title: extractTitle(jsonLdList),
    author: extractAuthor(jsonLdList),
    date: extractDate(jsonLdList),
    url: extractUrl(),
    accessDate: new Date().toISOString().split("T")[0],
  };

  if (type === "journal_article") {
    return { ...base, ...extractJournalFields(jsonLdList) };
  }
  return { ...base, ...extractWebsiteFields(jsonLdList) };
}
