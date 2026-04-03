import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import MetadataCard from "../../src/popup/components/MetadataCard.jsx";

const websiteMeta = {
  type: "website",
  title: "Why the Web Needs Better Citation Tools",
  author: "Jane Smith",
  date: "2024-03-15",
  url: "https://example.com/article",
  publisher: "The Atlantic",
};

const journalMeta = {
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
};

describe("MetadataCard", () => {
  it("renders the title", () => {
    render(<MetadataCard metadata={websiteMeta} />);
    expect(
      screen.getByText("Why the Web Needs Better Citation Tools")
    ).toBeInTheDocument();
  });

  it("renders the author", () => {
    render(<MetadataCard metadata={websiteMeta} />);
    expect(screen.getByText(/Jane Smith/)).toBeInTheDocument();
  });

  it("shows 'Website' badge for website type", () => {
    render(<MetadataCard metadata={websiteMeta} />);
    expect(screen.getByText("Website")).toBeInTheDocument();
  });

  it("shows 'Journal Article' badge for journal_article type", () => {
    render(<MetadataCard metadata={journalMeta} />);
    expect(screen.getByText("Journal Article")).toBeInTheDocument();
  });

  it("shows the date when it is not n.d.", () => {
    render(<MetadataCard metadata={websiteMeta} />);
    expect(screen.getByText("2024-03-15")).toBeInTheDocument();
  });

  it("hides the date when it is n.d.", () => {
    render(<MetadataCard metadata={{ ...websiteMeta, date: "n.d." }} />);
    expect(screen.queryByText("n.d.")).not.toBeInTheDocument();
  });

  it("shows the publisher when it is not Unknown Publisher", () => {
    render(<MetadataCard metadata={websiteMeta} />);
    expect(screen.getByText(/The Atlantic/)).toBeInTheDocument();
  });

  it("hides the publisher when it is Unknown Publisher", () => {
    render(
      <MetadataCard metadata={{ ...websiteMeta, publisher: "Unknown Publisher" }} />
    );
    expect(screen.queryByText("Unknown Publisher")).not.toBeInTheDocument();
  });
});
