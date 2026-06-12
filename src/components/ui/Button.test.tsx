import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "./Button";

describe("Button", () => {
  it("renders a button with base and custom classes", () => {
    render(<Button className="h-10 bg-primary">Save</Button>);

    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toHaveClass("inline-flex");
    expect(button).toHaveClass("items-center");
    expect(button).toHaveClass("h-10");
    expect(button).toHaveClass("bg-primary");
  });

  it("renders the child element when asChild is enabled", () => {
    render(
      <Button asChild className="text-primary">
        <a href="https://example.com/dashboard">Dashboard</a>
      </Button>,
    );

    const link = screen.getByRole("link", { name: "Dashboard" });
    expect(link).toHaveAttribute("href", "https://example.com/dashboard");
    expect(link.tagName).toBe("A");
    expect(link).toHaveClass("inline-flex");
    expect(link).toHaveClass("text-primary");
  });
});
