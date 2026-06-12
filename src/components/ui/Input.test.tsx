import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Input } from "./Input";

describe("Input", () => {
  it("renders an input with default mobile text attributes", () => {
    render(<Input aria-label="Workspace name" placeholder="Name" />);

    const input = screen.getByLabelText("Workspace name");
    expect(input).toHaveAttribute("autoCapitalize", "none");
    expect(input).toHaveAttribute("autoCorrect", "off");
    expect(input).toHaveAttribute("placeholder", "Name");
    expect(input).toHaveClass("h-[52px]");
  });

  it("renders label, container class, and right element", () => {
    render(
      <Input
        label="Password"
        containerClassName="space-y-4"
        rightElement={<span data-testid="right-element">Show</span>}
      />,
    );

    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByTestId("right-element")).toHaveTextContent("Show");
    expect(screen.getByText("Password").parentElement).toHaveClass("space-y-4");
  });

  it("forwards refs to the input element", () => {
    const ref = vi.fn();

    render(<Input ref={ref} />);

    expect(ref).toHaveBeenCalledWith(expect.any(HTMLInputElement));
  });
});
