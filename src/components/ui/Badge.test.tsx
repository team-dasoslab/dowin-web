import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Badge } from "./Badge";

describe("Badge", () => {
  it("renders a span with base and custom classes", () => {
    render(<Badge className="bg-primary">Active</Badge>);

    const badge = screen.getByText("Active");
    expect(badge.tagName).toBe("SPAN");
    expect(badge).toHaveClass("inline-flex");
    expect(badge).toHaveClass("bg-primary");
  });

  it("forwards refs to the span element", () => {
    const ref = vi.fn();

    render(<Badge ref={ref}>Ready</Badge>);

    expect(ref).toHaveBeenCalledWith(expect.any(HTMLSpanElement));
  });
});
