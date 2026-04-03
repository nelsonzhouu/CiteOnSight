import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import LoadingSpinner from "../../src/popup/components/LoadingSpinner.jsx";

describe("LoadingSpinner", () => {
  it("renders an element with the animate-spin class", () => {
    const { container } = render(<LoadingSpinner />);
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
  });
});
