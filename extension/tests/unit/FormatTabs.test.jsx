import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import FormatTabs from "../../src/popup/components/FormatTabs.jsx";

const FORMATS = ["APA", "MLA", "Chicago", "IEEE", "Harvard"];

describe("FormatTabs", () => {
  it("renders all five format tabs", () => {
    render(
      <FormatTabs formats={FORMATS} selected="APA" onChange={() => {}} />
    );
    for (const format of FORMATS) {
      expect(screen.getByText(format)).toBeInTheDocument();
    }
  });

  it("calls onChange with the clicked format", () => {
    const onChange = vi.fn();
    render(<FormatTabs formats={FORMATS} selected="APA" onChange={onChange} />);
    fireEvent.click(screen.getByText("MLA"));
    expect(onChange).toHaveBeenCalledWith("MLA");
  });

  it("calls onChange when each tab is clicked", () => {
    const onChange = vi.fn();
    render(<FormatTabs formats={FORMATS} selected="APA" onChange={onChange} />);
    fireEvent.click(screen.getByText("Chicago"));
    expect(onChange).toHaveBeenCalledWith("Chicago");
    fireEvent.click(screen.getByText("IEEE"));
    expect(onChange).toHaveBeenCalledWith("IEEE");
    fireEvent.click(screen.getByText("Harvard"));
    expect(onChange).toHaveBeenCalledWith("Harvard");
  });

  it("applies active styles to the selected tab", () => {
    render(<FormatTabs formats={FORMATS} selected="MLA" onChange={() => {}} />);
    const mlaButton = screen.getByText("MLA");
    // Active tab should have text-accent class (teal color)
    expect(mlaButton.className).toContain("text-accent");
  });

  it("applies inactive styles to non-selected tabs", () => {
    render(<FormatTabs formats={FORMATS} selected="APA" onChange={() => {}} />);
    const mlaButton = screen.getByText("MLA");
    expect(mlaButton.className).toContain("text-gray-400");
  });
});
