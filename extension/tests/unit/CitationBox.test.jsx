import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import CitationBox from "../../src/popup/components/CitationBox.jsx";

// No *...*  markers — used for tests that don't need to exercise italics logic
const SAMPLE_CITATION =
  "Smith, J. (2024, March 15). Why the Web Needs Better Citation Tools. The Atlantic. https://example.com/article";

// Reflects a real APA journal citation with markdown italics from the mock service
const ITALIC_CITATION =
  "Smith, J. (2024). Title. *Nature*, 500(1), 1–10. https://doi.org/10.1038/test";

describe("CitationBox — loaded state", () => {
  beforeEach(() => {
    // jsdom doesn't implement the clipboard API — mock both methods
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
        write: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it("renders the citation text", () => {
    render(<CitationBox citation={SAMPLE_CITATION} isLoading={false} />);
    expect(screen.getByText(SAMPLE_CITATION)).toBeInTheDocument();
  });

  it("renders a Copy button", () => {
    render(<CitationBox citation={SAMPLE_CITATION} isLoading={false} />);
    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
  });

  it("shows 'Copied!' after clicking copy", async () => {
    render(<CitationBox citation={SAMPLE_CITATION} isLoading={false} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    });
    expect(screen.getByRole("button", { name: "Copied!" })).toBeInTheDocument();
  });

  it("applies hanging indent and URL wrapping to the citation paragraph", () => {
    const { container } = render(
      <CitationBox citation={SAMPLE_CITATION} isLoading={false} />
    );
    const p = container.querySelector("p");
    expect(p.style.textIndent).toBe("-2em");
    expect(p.style.paddingLeft).toBe("2em");
    // overflow-wrap prevents long URLs from overflowing the 380px popup width
    expect(p.style.overflowWrap).toBe("break-word");
  });
});

describe("CitationBox — italic rendering", () => {
  it("renders *text* markers as <em> elements", () => {
    const { container } = render(
      <CitationBox citation={ITALIC_CITATION} isLoading={false} />
    );
    const em = container.querySelector("em");
    expect(em).toBeInTheDocument();
    expect(em.textContent).toBe("Nature");
  });

  it("renders text outside markers as plain text nodes (not wrapped in em)", () => {
    const { container } = render(
      <CitationBox citation="Smith, J. (2024). *Journal*." isLoading={false} />
    );
    const ems = container.querySelectorAll("em");
    expect(ems).toHaveLength(1);
    expect(ems[0].textContent).toBe("Journal");
  });

  it("renders a citation with no markers as plain text with no em elements", () => {
    const { container } = render(
      <CitationBox citation={SAMPLE_CITATION} isLoading={false} />
    );
    expect(container.querySelectorAll("em")).toHaveLength(0);
  });
});

describe("CitationBox — clipboard copy", () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
        write: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it("strips *...* markers from the plain-text fallback copy", async () => {
    // In jsdom ClipboardItem is undefined, so the component falls back to writeText
    render(<CitationBox citation={ITALIC_CITATION} isLoading={false} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    });
    const calledWith = navigator.clipboard.writeText.mock.calls[0]?.[0];
    expect(calledWith).not.toContain("*");
    expect(calledWith).toContain("Nature");
  });

  it("plain-text copy of a no-markup citation is unchanged", async () => {
    render(<CitationBox citation={SAMPLE_CITATION} isLoading={false} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(SAMPLE_CITATION);
  });
});

describe("CitationBox — loading state", () => {
  it("shows a spinner when isLoading is true", () => {
    const { container } = render(
      <CitationBox citation={null} isLoading={true} />
    );
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("does not show a Copy button while loading", () => {
    render(<CitationBox citation={null} isLoading={true} />);
    expect(screen.queryByRole("button", { name: "Copy" })).not.toBeInTheDocument();
  });
});
