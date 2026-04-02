import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  extractMetadata,
  detectSourceType,
} from "../../src/utils/extractMetadata.js";

// --- DOM setup helpers ---

function addMeta(name, content) {
  const el = document.createElement("meta");
  el.name = name;
  el.content = content;
  document.head.appendChild(el);
}

function addMetaProperty(property, content) {
  const el = document.createElement("meta");
  el.setAttribute("property", property);
  el.content = content;
  document.head.appendChild(el);
}

function addJsonLd(data) {
  const el = document.createElement("script");
  el.type = "application/ld+json";
  el.textContent = JSON.stringify(data);
  document.head.appendChild(el);
}

function addCanonical(href) {
  const el = document.createElement("link");
  el.rel = "canonical";
  el.href = href;
  document.head.appendChild(el);
}

beforeEach(() => {
  document.head.innerHTML = "";
  document.body.innerHTML = "";
  document.title = "";
});


// --- Source type detection ---

describe("detectSourceType", () => {
  it("detects journal_article when citation_doi meta tag is present", () => {
    addMeta("citation_doi", "10.1038/s41586-024-07487-w");
    const result = extractMetadata();
    expect(result.type).toBe("journal_article");
  });

  it("detects journal_article when citation_journal_title meta tag is present", () => {
    addMeta("citation_journal_title", "Nature");
    const result = extractMetadata();
    expect(result.type).toBe("journal_article");
  });

  it("detects journal_article from ScholarlyArticle JSON-LD", () => {
    addJsonLd({ "@type": "ScholarlyArticle", headline: "Test" });
    const result = extractMetadata();
    expect(result.type).toBe("journal_article");
  });

  it("does NOT detect journal_article from plain Article JSON-LD (e.g. Wikipedia)", () => {
    addJsonLd({ "@type": "Article", headline: "Photosynthesis" });
    const result = extractMetadata();
    expect(result.type).toBe("website");
  });

  it("does NOT detect journal_article from NewsArticle JSON-LD", () => {
    addJsonLd({ "@type": "NewsArticle", headline: "Breaking News" });
    const result = extractMetadata();
    expect(result.type).toBe("website");
  });

  it("defaults to website when no academic signals are found", () => {
    document.title = "Some Blog Post";
    const result = extractMetadata();
    expect(result.type).toBe("website");
  });
});

// --- Title extraction ---

describe("title extraction", () => {
  it("prefers og:title over document.title", () => {
    document.title = "Page Title | Site Name";
    addMetaProperty("og:title", "Clean Article Title");
    const result = extractMetadata();
    expect(result.title).toBe("Clean Article Title");
  });

  it("falls back to document.title when no meta tags are set", () => {
    document.title = "Fallback Title";
    const result = extractMetadata();
    expect(result.title).toBe("Fallback Title");
  });

  it("extracts headline from JSON-LD when og:title is absent", () => {
    addJsonLd({ "@type": "Article", headline: "JSON-LD Headline" });
    const result = extractMetadata();
    expect(result.title).toBe("JSON-LD Headline");
  });
});

// --- Author extraction ---

describe("author extraction", () => {
  it("extracts a single author from the author meta tag", () => {
    addMeta("author", "Jane Smith");
    const result = extractMetadata();
    expect(result.author).toBe("Jane Smith");
  });

  it("joins multiple citation_author tags into a comma-separated string", () => {
    addMeta("citation_author", "Jane Smith");
    addMeta("citation_author", "Bob Jones");
    addMeta("citation_author", "Alice Chen");
    const result = extractMetadata();
    expect(result.author).toBe("Jane Smith, Bob Jones, Alice Chen");
  });

  it("extracts author array from JSON-LD", () => {
    addJsonLd({
      "@type": "Article",
      author: [{ name: "Jane Smith" }, { name: "Bob Jones" }],
    });
    const result = extractMetadata();
    expect(result.author).toBe("Jane Smith, Bob Jones");
  });

  it("extracts a plain string author from JSON-LD", () => {
    addJsonLd({ "@type": "Article", author: "Jane Smith" });
    const result = extractMetadata();
    expect(result.author).toBe("Jane Smith");
  });

  it("skips [rel=author] when its text content is a URL", () => {
    document.body.innerHTML =
      '<a rel="author" href="https://www.nbcsports.com/author/mike-florio">https://www.nbcsports.com/author/mike-florio</a>';
    addMeta("author", "Mike Florio");
    const result = extractMetadata();
    expect(result.author).toBe("Mike Florio");
  });

  it("skips article:author meta when it contains a URL", () => {
    addMetaProperty("article:author", "https://www.nbcsports.com/author/mike-florio");
    addMeta("author", "Mike Florio");
    const result = extractMetadata();
    expect(result.author).toBe("Mike Florio");
  });

  it("uses [rel=author] text when it is a real name, not a URL", () => {
    document.body.innerHTML = '<a rel="author" href="/author/mike-florio">Mike Florio</a>';
    const result = extractMetadata();
    expect(result.author).toBe("Mike Florio");
  });

  it("falls back to 'Unknown Author' when no author signals are found", () => {
    document.title = "Some Page";
    const result = extractMetadata();
    expect(result.author).toBe("Unknown Author");
  });
});

// --- Date extraction ---

describe("date extraction", () => {
  it("normalizes ISO 8601 datetime to YYYY-MM-DD", () => {
    addMetaProperty("article:published_time", "2024-03-15T09:00:00Z");
    const result = extractMetadata();
    expect(result.date).toBe("2024-03-15");
  });

  it("returns a plain YYYY-MM-DD date unchanged", () => {
    addMeta("date", "2024-03-15");
    const result = extractMetadata();
    expect(result.date).toBe("2024-03-15");
  });

  it("extracts datePublished from JSON-LD", () => {
    addJsonLd({ "@type": "Article", datePublished: "2023-11-01" });
    const result = extractMetadata();
    expect(result.date).toBe("2023-11-01");
  });

  it("extracts date from a <time datetime> element", () => {
    document.body.innerHTML = '<time datetime="2024-06-20">June 20, 2024</time>';
    const result = extractMetadata();
    expect(result.date).toBe("2024-06-20");
  });

  it("returns 'n.d.' when no date signals are found", () => {
    document.title = "Some Page";
    const result = extractMetadata();
    expect(result.date).toBe("n.d.");
  });
});

// --- URL extraction ---

describe("url extraction", () => {
  it("prefers canonical URL over window.location", () => {
    addCanonical("https://example.com/clean-url");
    const result = extractMetadata();
    expect(result.url).toBe("https://example.com/clean-url");
  });
});

// --- accessDate ---

describe("accessDate", () => {
  it("always returns today's date in YYYY-MM-DD format", () => {
    const result = extractMetadata();
    expect(result.accessDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result.accessDate).toBe(new Date().toISOString().split("T")[0]);
  });
});

// --- Website-specific fields ---

describe("website fields", () => {
  it("extracts publisher from og:site_name", () => {
    addMetaProperty("og:site_name", "The Atlantic");
    const result = extractMetadata();
    expect(result.publisher).toBe("The Atlantic");
  });

  it("falls back to 'Unknown Publisher' when no publisher signals are found", () => {
    document.title = "Some Page";
    const result = extractMetadata();
    expect(result.publisher).toBe("Unknown Publisher");
  });
});

// --- Journal article fields ---

describe("journal article fields", () => {
  it("extracts doi from citation_doi meta tag", () => {
    addMeta("citation_doi", "10.1038/s41586-024-07487-w");
    const result = extractMetadata();
    expect(result.doi).toBe("10.1038/s41586-024-07487-w");
  });

  it("extracts journalName, volume, issue from Highwire meta tags", () => {
    addMeta("citation_doi", "10.1038/test");
    addMeta("citation_journal_title", "Nature");
    addMeta("citation_volume", "629");
    addMeta("citation_issue", "8014");
    const result = extractMetadata();
    expect(result.journalName).toBe("Nature");
    expect(result.volume).toBe("629");
    expect(result.issue).toBe("8014");
  });

  it("builds page range from firstpage and lastpage tags", () => {
    addMeta("citation_doi", "10.1038/test");
    addMeta("citation_firstpage", "45");
    addMeta("citation_lastpage", "51");
    const result = extractMetadata();
    expect(result.pages).toBe("45–51");
  });

  it("returns null for doi when not found", () => {
    addMeta("citation_journal_title", "Nature");
    const result = extractMetadata();
    expect(result.doi).toBeNull();
  });
});

// --- Error handling ---

describe("error handling", () => {
  it("ignores malformed JSON-LD and continues extracting from other sources", () => {
    const el = document.createElement("script");
    el.type = "application/ld+json";
    el.textContent = "{ this is not valid json }";
    document.head.appendChild(el);
    addMetaProperty("og:title", "Title from OG Tag");
    const result = extractMetadata();
    expect(result.title).toBe("Title from OG Tag");
  });

  it("returns structured object with fallbacks when page has no metadata", () => {
    const result = extractMetadata();
    expect(result.type).toBe("website");
    expect(result.title).toBeDefined();
    expect(result.author).toBe("Unknown Author");
    expect(result.date).toBe("n.d.");
    expect(result.publisher).toBe("Unknown Publisher");
    expect(result.accessDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
