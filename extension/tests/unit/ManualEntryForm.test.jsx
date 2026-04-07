import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import ManualEntryForm from "../../src/popup/components/ManualEntryForm.jsx";

// Mock the citation service so tests don't depend on formatting logic
vi.mock("../../src/popup/services/mockCitationService.js", () => ({
  CITATION_FORMATS: ["APA", "MLA", "Chicago", "IEEE", "Harvard"],
  formatCitation: vi.fn().mockResolvedValue("Smith, J. (2024). *Test Book*. Publisher."),
}));

// Mock storage so tests run without chrome.storage and we can control saved values
vi.mock("../../src/popup/services/storage.js", () => ({
  loadStorage: vi.fn().mockResolvedValue(null),
  saveStorage: vi.fn(),
  clearStorage: vi.fn(),
}));

import { loadStorage, clearStorage } from "../../src/popup/services/storage.js";

function fillTitle(value) {
  const input = screen.getByLabelText(/title/i);
  fireEvent.change(input, { target: { value } });
}

describe("ManualEntryForm — initial render", () => {
  it("renders the Back button", () => {
    render(<ManualEntryForm onBack={() => {}} />);
    expect(screen.getByText("← Back")).toBeInTheDocument();
  });

  it("renders three source type buttons", () => {
    render(<ManualEntryForm onBack={() => {}} />);
    expect(screen.getByText("Website")).toBeInTheDocument();
    expect(screen.getByText("Journal Article")).toBeInTheDocument();
    expect(screen.getByText("Book")).toBeInTheDocument();
  });

  it("defaults to Website source type", () => {
    render(<ManualEntryForm onBack={() => {}} />);
    // Website-specific fields should be visible by default
    expect(screen.getByText("Publisher / Site Name")).toBeInTheDocument();
  });

  it("renders the Title field", () => {
    render(<ManualEntryForm onBack={() => {}} />);
    expect(screen.getByText("Title *")).toBeInTheDocument();
  });

  it("renders one author input by default", () => {
    render(<ManualEntryForm onBack={() => {}} />);
    const inputs = screen.getAllByPlaceholderText("Any name format");
    expect(inputs).toHaveLength(1);
  });

  it("shows the placeholder text when title is empty", () => {
    render(<ManualEntryForm onBack={() => {}} />);
    expect(screen.getByText("Fill in a title to preview the citation.")).toBeInTheDocument();
  });
});

describe("ManualEntryForm — Back button", () => {
  it("calls onBack when the Back button is clicked", () => {
    const onBack = vi.fn();
    render(<ManualEntryForm onBack={onBack} />);
    fireEvent.click(screen.getByText("← Back"));
    expect(onBack).toHaveBeenCalledOnce();
  });
});

describe("ManualEntryForm — source type switching", () => {
  it("shows URL field for Website", () => {
    render(<ManualEntryForm onBack={() => {}} />);
    expect(screen.getByText("URL")).toBeInTheDocument();
  });

  it("shows Access Date field for Website", () => {
    render(<ManualEntryForm onBack={() => {}} />);
    expect(screen.getByText("Access Date")).toBeInTheDocument();
  });

  it("does not show Access Date field for Journal Article", () => {
    render(<ManualEntryForm onBack={() => {}} />);
    fireEvent.click(screen.getByText("Journal Article"));
    expect(screen.queryByText("Access Date")).not.toBeInTheDocument();
  });

  it("does not show Access Date field for Book", () => {
    render(<ManualEntryForm onBack={() => {}} />);
    fireEvent.click(screen.getByText("Book"));
    expect(screen.queryByText("Access Date")).not.toBeInTheDocument();
  });

  it("shows Journal Name field when Journal Article is selected", () => {
    render(<ManualEntryForm onBack={() => {}} />);
    fireEvent.click(screen.getByText("Journal Article"));
    expect(screen.getByText("Journal Name")).toBeInTheDocument();
  });

  it("shows DOI and Pages fields when Journal Article is selected", () => {
    render(<ManualEntryForm onBack={() => {}} />);
    fireEvent.click(screen.getByText("Journal Article"));
    expect(screen.getByText("DOI")).toBeInTheDocument();
    expect(screen.getByText("Pages")).toBeInTheDocument();
  });

  it("shows Edition field when Book is selected", () => {
    render(<ManualEntryForm onBack={() => {}} />);
    fireEvent.click(screen.getByText("Book"));
    expect(screen.getByText("Edition")).toBeInTheDocument();
  });

  it("hides URL field when Book is selected", () => {
    render(<ManualEntryForm onBack={() => {}} />);
    fireEvent.click(screen.getByText("Book"));
    expect(screen.queryByText("URL")).not.toBeInTheDocument();
  });

  it("shows Publisher Location field when Book is selected", () => {
    render(<ManualEntryForm onBack={() => {}} />);
    fireEvent.click(screen.getByText("Book"));
    expect(screen.getByText("Publisher Location")).toBeInTheDocument();
  });

  it("does not show Publisher Location field for Website", () => {
    render(<ManualEntryForm onBack={() => {}} />);
    expect(screen.queryByText("Publisher Location")).not.toBeInTheDocument();
  });

  it("does not show Publisher Location field for Journal Article", () => {
    render(<ManualEntryForm onBack={() => {}} />);
    fireEvent.click(screen.getByText("Journal Article"));
    expect(screen.queryByText("Publisher Location")).not.toBeInTheDocument();
  });

  it("resets the title field when switching source types", () => {
    render(<ManualEntryForm onBack={() => {}} />);
    fillTitle("My Title");
    fireEvent.click(screen.getByText("Book"));
    expect(screen.getByLabelText(/title/i).value).toBe("");
  });
});

describe("ManualEntryForm — author add and remove", () => {
  it("adds a second author input when '+ Add author' is clicked", () => {
    render(<ManualEntryForm onBack={() => {}} />);
    fireEvent.click(screen.getByText("+ Add author"));
    expect(screen.getAllByPlaceholderText("Any name format")).toHaveLength(2);
  });

  it("shows the × remove button when there are multiple authors", () => {
    render(<ManualEntryForm onBack={() => {}} />);
    fireEvent.click(screen.getByText("+ Add author"));
    expect(screen.getAllByLabelText("Remove author")).toHaveLength(2);
  });

  it("does not show the × remove button when there is only one author", () => {
    render(<ManualEntryForm onBack={() => {}} />);
    expect(screen.queryByLabelText("Remove author")).not.toBeInTheDocument();
  });

  it("removes an author input when × is clicked", () => {
    render(<ManualEntryForm onBack={() => {}} />);
    fireEvent.click(screen.getByText("+ Add author"));
    const removeButtons = screen.getAllByLabelText("Remove author");
    fireEvent.click(removeButtons[1]);
    expect(screen.getAllByPlaceholderText("Any name format")).toHaveLength(1);
  });
});

describe("ManualEntryForm — citation preview", () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
        write: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it("shows the format tabs", () => {
    render(<ManualEntryForm onBack={() => {}} />);
    expect(screen.getByText("APA")).toBeInTheDocument();
    expect(screen.getByText("MLA")).toBeInTheDocument();
  });

  it("replaces the placeholder with a citation once title is filled", async () => {
    render(<ManualEntryForm onBack={() => {}} />);
    await act(async () => {
      fillTitle("Test Title");
    });
    await waitFor(() => {
      expect(
        screen.queryByText("Fill in a title to preview the citation.")
      ).not.toBeInTheDocument();
    });
  });

  it("restores the placeholder when title is cleared", async () => {
    render(<ManualEntryForm onBack={() => {}} />);
    await act(async () => {
      fillTitle("Test Title");
    });
    await waitFor(() =>
      expect(
        screen.queryByText("Fill in a title to preview the citation.")
      ).not.toBeInTheDocument()
    );
    await act(async () => {
      fillTitle("");
    });
    expect(
      screen.getByText("Fill in a title to preview the citation.")
    ).toBeInTheDocument();
  });
});

describe("ManualEntryForm — storage persistence", () => {
  beforeEach(() => {
    vi.mocked(loadStorage).mockResolvedValue(null);
    vi.mocked(clearStorage).mockClear();
  });

  it("restores title from saved form state on mount", async () => {
    vi.mocked(loadStorage).mockResolvedValueOnce({
      sourceType: "website",
      title: "Saved Article Title",
      authors: ["Jane Smith"],
      date: "2024-01-15",
      publisher: "The Atlantic",
      url: "https://example.com",
      selectedFormat: "APA",
    });
    render(<ManualEntryForm onBack={() => {}} />);
    await waitFor(() => {
      expect(screen.getByLabelText(/title/i).value).toBe("Saved Article Title");
    });
  });

  it("restores source type from saved form state on mount", async () => {
    vi.mocked(loadStorage).mockResolvedValueOnce({
      sourceType: "book",
      title: "Saved Book",
      authors: [""],
    });
    render(<ManualEntryForm onBack={() => {}} />);
    await waitFor(() => {
      // Book-specific field is shown when book source type is restored
      expect(screen.getByText("Edition")).toBeInTheDocument();
    });
  });

  it("renders the Clear Form button", () => {
    render(<ManualEntryForm onBack={() => {}} />);
    expect(screen.getByText("Clear Form")).toBeInTheDocument();
  });

  it("clears saved storage when Clear Form is clicked", () => {
    render(<ManualEntryForm onBack={() => {}} />);
    fireEvent.click(screen.getByText("Clear Form"));
    expect(clearStorage).toHaveBeenCalledWith("manualForm");
  });

  it("clears the title field when Clear Form is clicked", () => {
    render(<ManualEntryForm onBack={() => {}} />);
    fillTitle("Some Title");
    fireEvent.click(screen.getByText("Clear Form"));
    expect(screen.getByLabelText(/title/i).value).toBe("");
  });
});
