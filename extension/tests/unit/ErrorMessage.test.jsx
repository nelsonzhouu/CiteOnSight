import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ErrorMessage from "../../src/popup/components/ErrorMessage.jsx";

describe("ErrorMessage", () => {
  it("shows browser page message for errorType 'browser_page'", () => {
    render(<ErrorMessage errorType="browser_page" />);
    expect(screen.getByText("Can't cite this page")).toBeInTheDocument();
    expect(screen.getByText(/browser pages/)).toBeInTheDocument();
  });

  it("shows timeout message for errorType 'timeout'", () => {
    render(<ErrorMessage errorType="timeout" />);
    expect(screen.getByText("Couldn't read this page")).toBeInTheDocument();
    expect(screen.getByText(/didn't respond in time/)).toBeInTheDocument();
  });

  it("shows generic message for errorType 'unknown'", () => {
    render(<ErrorMessage errorType="unknown" />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("falls back to generic message for an unrecognized error type", () => {
    render(<ErrorMessage errorType="some_future_error" />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });
});
