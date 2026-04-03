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
