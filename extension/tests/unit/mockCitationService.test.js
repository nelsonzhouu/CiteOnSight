import { describe, it, expect } from "vitest";
import { formatCitation, CITATION_FORMATS } from "../../src/popup/services/mockCitationService.js";

const websiteMetadata = {
  type: "website",
  title: "Why the Web Needs Better Citation Tools",
  author: "Jane Smith",
  date: "2024-03-15",
  url: "https://example.com/article",
  publisher: "The Atlantic",
  accessDate: "2024-06-01",
};

const journalMetadata = {
  type: "journal_article",
  title: "Machine Learning in Climate Science",
  author: "Bob Jones",
  date: "2023-09-01",
  url: "https://doi.org/10.1038/test",
  doi: "10.1038/test",
  journalName: "Nature",
  volume: "612",
  issue: "3",
  pages: "45–51",
  accessDate: "2024-06-01",
};

const noAuthorMetadata = {
  ...websiteMetadata,
  author: "Unknown Author",
};

describe("formatCitation — CITATION_FORMATS", () => {
  it("exports all five format names", () => {
    expect(CITATION_FORMATS).toEqual(["APA", "MLA", "Chicago", "IEEE", "Harvard"]);
  });
});

describe("formatCitation — returns a string for every format", () => {
  for (const format of ["APA", "MLA", "Chicago", "IEEE", "Harvard"]) {
    it(`returns a non-empty string for ${format} (website)`, async () => {
      const result = await formatCitation(websiteMetadata, format);
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it(`returns a non-empty string for ${format} (journal article)`, async () => {
      const result = await formatCitation(journalMetadata, format);
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });
  }
});

describe("formatCitation — APA", () => {
  it("includes last name and initial for website", async () => {
    const result = await formatCitation(websiteMetadata, "APA");
    expect(result).toContain("Smith, J.");
  });

  it("includes the title", async () => {
    const result = await formatCitation(websiteMetadata, "APA");
    expect(result).toContain("Why the Web Needs Better Citation Tools");
  });

  it("includes the URL", async () => {
    const result = await formatCitation(websiteMetadata, "APA");
    expect(result).toContain("https://example.com/article");
  });

  it("includes DOI URL for journal articles", async () => {
    const result = await formatCitation(journalMetadata, "APA");
    expect(result).toContain("https://doi.org/10.1038/test");
  });

  it("handles Unknown Author — omits author portion", async () => {
    const result = await formatCitation(noAuthorMetadata, "APA");
    expect(result).not.toContain("Unknown Author");
  });
});

describe("formatCitation — MLA", () => {
  it("uses 'Last, First' author format", async () => {
    const result = await formatCitation(websiteMetadata, "MLA");
    expect(result).toContain("Smith, Jane");
  });

  it("wraps title in quotes", async () => {
    const result = await formatCitation(websiteMetadata, "MLA");
    expect(result).toContain('"Why the Web Needs Better Citation Tools."');
  });
});

describe("formatCitation — Chicago", () => {
  it("uses 'Last, First' author format", async () => {
    const result = await formatCitation(websiteMetadata, "Chicago");
    expect(result).toContain("Smith, Jane");
  });

  it("wraps title in quotes", async () => {
    const result = await formatCitation(websiteMetadata, "Chicago");
    expect(result).toContain('"Why the Web Needs Better Citation Tools."');
  });
});

describe("formatCitation — IEEE", () => {
  it("uses 'F. Last' author format", async () => {
    const result = await formatCitation(websiteMetadata, "IEEE");
    expect(result).toContain("J. Smith");
  });
});

describe("formatCitation — Harvard", () => {
  it("uses 'Last, F.' author format", async () => {
    const result = await formatCitation(websiteMetadata, "Harvard");
    expect(result).toContain("Smith, J.");
  });

  it("includes 'Available at:' for websites", async () => {
    const result = await formatCitation(websiteMetadata, "Harvard");
    expect(result).toContain("Available at:");
  });
});

describe("formatCitation — error handling", () => {
  it("throws for an unknown format", async () => {
    await expect(formatCitation(websiteMetadata, "BibTeX")).rejects.toThrow(
      "Unknown citation format: BibTeX"
    );
  });
});

describe("formatCitation — n.d. date handling", () => {
  it("handles missing date (n.d.) without crashing", async () => {
    const meta = { ...websiteMetadata, date: "n.d." };
    const result = await formatCitation(meta, "APA");
    expect(result).toContain("n.d.");
  });
});

// --- Book citation tests ---

const bookMetadata = {
  type: "book",
  title: "Introduction to Algorithms",
  author: "Thomas H. Cormen | Charles E. Leiserson",
  date: "2022",
  publisher: "MIT Press",
  edition: "4th",
};

const bookNoEdition = { ...bookMetadata, edition: "" };
const bookNoAuthor = { ...bookMetadata, author: "Unknown Author" };

describe("formatCitation — book (returns non-empty string for all formats)", () => {
  for (const format of ["APA", "MLA", "Chicago", "IEEE", "Harvard"]) {
    it(`returns a non-empty string for ${format} (book)`, async () => {
      const result = await formatCitation(bookMetadata, format);
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });
  }
});

describe("formatCitation — APA book", () => {
  it("italicizes the title with *...*", async () => {
    const result = await formatCitation(bookMetadata, "APA");
    expect(result).toContain("*Introduction to Algorithms*");
  });

  it("includes the edition in parentheses", async () => {
    const result = await formatCitation(bookMetadata, "APA");
    expect(result).toContain("(4th ed.)");
  });

  it("includes the publisher", async () => {
    const result = await formatCitation(bookMetadata, "APA");
    expect(result).toContain("MIT Press");
  });

  it("omits edition when not provided", async () => {
    const result = await formatCitation(bookNoEdition, "APA");
    expect(result).not.toContain("ed.");
  });

  it("omits author when Unknown Author", async () => {
    const result = await formatCitation(bookNoAuthor, "APA");
    expect(result).not.toContain("Unknown Author");
  });
});

describe("formatCitation — MLA book", () => {
  it("italicizes the title", async () => {
    const result = await formatCitation(bookMetadata, "MLA");
    expect(result).toContain("*Introduction to Algorithms*");
  });

  it("includes edition with 'ed.'", async () => {
    const result = await formatCitation(bookMetadata, "MLA");
    expect(result).toContain("4th ed.");
  });

  it("includes the year", async () => {
    const result = await formatCitation(bookMetadata, "MLA");
    expect(result).toContain("2022");
  });
});

describe("formatCitation — Chicago book", () => {
  it("italicizes the title", async () => {
    const result = await formatCitation(bookMetadata, "Chicago");
    expect(result).toContain("*Introduction to Algorithms*");
  });

  it("includes edition with 'ed.'", async () => {
    const result = await formatCitation(bookMetadata, "Chicago");
    expect(result).toContain("4th ed.");
  });
});

describe("formatCitation — IEEE book", () => {
  it("italicizes the title", async () => {
    const result = await formatCitation(bookMetadata, "IEEE");
    expect(result).toContain("*Introduction to Algorithms*");
  });

  it("uses 'F. Last' author format", async () => {
    const result = await formatCitation(bookMetadata, "IEEE");
    // First author: "Thomas H. Cormen" → "T. H. Cormen"
    expect(result).toContain("T. H. Cormen");
  });
});

describe("formatCitation — book edition ordinal suffix", () => {
  it("adds 'st' suffix to edition 1", async () => {
    const result = await formatCitation({ ...bookMetadata, edition: "1" }, "APA");
    expect(result).toContain("(1st ed.)");
  });

  it("adds 'nd' suffix to edition 2", async () => {
    const result = await formatCitation({ ...bookMetadata, edition: "2" }, "APA");
    expect(result).toContain("(2nd ed.)");
  });

  it("adds 'rd' suffix to edition 3", async () => {
    const result = await formatCitation({ ...bookMetadata, edition: "3" }, "MLA");
    expect(result).toContain("3rd ed.");
  });

  it("adds 'th' suffix to edition 4", async () => {
    const result = await formatCitation({ ...bookMetadata, edition: "4" }, "Chicago");
    expect(result).toContain("4th ed.");
    expect(result).not.toContain("4 ed.");
  });

  it("uses 'th' for 11 (special case, not 11st)", async () => {
    const result = await formatCitation({ ...bookMetadata, edition: "11" }, "IEEE");
    expect(result).toContain("11th ed.");
  });

  it("uses 'th' for 12 (special case)", async () => {
    const result = await formatCitation({ ...bookMetadata, edition: "12" }, "Harvard");
    expect(result).toContain("12th edn.");
  });

  it("uses 'st' for 21 (21st, not 21th)", async () => {
    const result = await formatCitation({ ...bookMetadata, edition: "21" }, "APA");
    expect(result).toContain("(21st ed.)");
  });

  it("passes through a non-numeric edition like 'Revised' unchanged", async () => {
    const result = await formatCitation({ ...bookMetadata, edition: "Revised" }, "APA");
    expect(result).toContain("Revised ed.");
  });

  it("is idempotent — '4th' input still produces '4th ed.'", async () => {
    const result = await formatCitation({ ...bookMetadata, edition: "4th" }, "APA");
    expect(result).toContain("(4th ed.)");
    expect(result).not.toContain("4thth");
  });
});

describe("formatCitation — Chicago book with publisher location", () => {
  it("formats as 'Location: Publisher, Year' when location is provided", async () => {
    const result = await formatCitation(
      { ...bookMetadata, publisherLocation: "Cambridge, MA" },
      "Chicago"
    );
    expect(result).toContain("Cambridge, MA: MIT Press");
    expect(result).toContain("2022");
  });

  it("omits location colon when location is absent (current behavior unchanged)", async () => {
    const result = await formatCitation(bookMetadata, "Chicago");
    expect(result).toContain("MIT Press");
    expect(result).not.toContain(":");
  });
});

describe("formatCitation — IEEE book with publisher location", () => {
  it("formats as 'Location: Publisher, Year' when location is provided", async () => {
    const result = await formatCitation(
      { ...bookMetadata, publisherLocation: "New York" },
      "IEEE"
    );
    expect(result).toContain("New York: MIT Press");
    expect(result).toContain("2022");
  });

  it("omits location colon when location is absent (current behavior unchanged)", async () => {
    const result = await formatCitation(bookMetadata, "IEEE");
    expect(result).toContain("MIT Press");
    expect(result).not.toContain(":");
  });
});

describe("formatCitation — Harvard book", () => {
  it("italicizes the title", async () => {
    const result = await formatCitation(bookMetadata, "Harvard");
    expect(result).toContain("*Introduction to Algorithms*");
  });

  it("uses 'edn.' for edition", async () => {
    const result = await formatCitation(bookMetadata, "Harvard");
    expect(result).toContain("4th edn.");
  });

  it("places year in parentheses after author", async () => {
    const result = await formatCitation(bookMetadata, "Harvard");
    expect(result).toMatch(/\(2022\)/);
  });
});
