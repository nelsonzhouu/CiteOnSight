import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import CitationBox from "../../src/popup/components/CitationBox.jsx";

const SAMPLE_CITATION =
  "Smith, J. (2024, March 15). Why the Web Needs Better Citation Tools. The Atlantic. https://example.com/article";

describe("CitationBox — loaded state", () => {
  beforeEach(() => {
    // Mock the clipboard API — it's not available in jsdom
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
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

  it("calls clipboard.writeText with the citation on copy", async () => {
    render(<CitationBox citation={SAMPLE_CITATION} isLoading={false} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(SAMPLE_CITATION);
  });

  it("shows 'Copied!' after clicking copy", async () => {
    render(<CitationBox citation={SAMPLE_CITATION} isLoading={false} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    });
    expect(screen.getByRole("button", { name: "Copied!" })).toBeInTheDocument();
  });
});

describe("CitationBox — loading state", () => {
  it("shows a spinner when isLoading is true", () => {
    const { container } = render(
      <CitationBox citation={null} isLoading={true} />
    );
    // Spinner is a div with animate-spin class
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("does not show a Copy button while loading", () => {
    render(<CitationBox citation={null} isLoading={true} />);
    expect(screen.queryByRole("button", { name: "Copy" })).not.toBeInTheDocument();
  });
});
