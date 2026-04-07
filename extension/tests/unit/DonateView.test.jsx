import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import DonateView from "../../src/popup/components/DonateView.jsx";

describe("DonateView", () => {
  it("renders the heading", () => {
    render(<DonateView onBack={() => {}} />);
    expect(screen.getByText("Support CiteOnSight")).toBeInTheDocument();
  });

  it("renders the Back button", () => {
    render(<DonateView onBack={() => {}} />);
    expect(screen.getByText("← Back")).toBeInTheDocument();
  });

  it("calls onBack when Back is clicked", () => {
    const onBack = vi.fn();
    render(<DonateView onBack={onBack} />);
    fireEvent.click(screen.getByText("← Back"));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it("renders the Ko-fi donate link", () => {
    render(<DonateView onBack={() => {}} />);
    expect(screen.getByRole("link", { name: /donate on ko-fi/i })).toBeInTheDocument();
  });

  it("links to the placeholder Ko-fi URL", () => {
    render(<DonateView onBack={() => {}} />);
    const link = screen.getByRole("link", { name: /donate on ko-fi/i });
    expect(link).toHaveAttribute("href", "https://ko-fi.com/citeonsight");
  });

  it("opens the link in a new tab", () => {
    render(<DonateView onBack={() => {}} />);
    const link = screen.getByRole("link", { name: /donate on ko-fi/i });
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("includes rel=noreferrer on the external link", () => {
    render(<DonateView onBack={() => {}} />);
    const link = screen.getByRole("link", { name: /donate on ko-fi/i });
    expect(link).toHaveAttribute("rel", "noreferrer");
  });
});
