import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Card } from "./Card";

describe("Card", () => {
  it("adds the default rounded class when no rounded class is supplied", () => {
    render(<Card>Panel</Card>);

    expect(screen.getByText("Panel")).toHaveClass("rounded-content");
  });

  it("does not add the default rounded class when a custom rounded class is supplied", () => {
    render(<Card className="rounded-none">Panel</Card>);

    const card = screen.getByText("Panel");
    expect(card).toHaveClass("rounded-none");
  });

  it("forwards refs to the card element", () => {
    const ref = vi.fn();

    render(<Card ref={ref}>Panel</Card>);

    expect(ref).toHaveBeenCalledWith(expect.any(HTMLDivElement));
  });
});
