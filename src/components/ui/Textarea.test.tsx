import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Textarea } from "./Textarea";

describe("Textarea", () => {
  it("renders a textarea with default mobile text attributes", () => {
    render(<Textarea aria-label="Message" placeholder="Details" />);

    const textarea = screen.getByLabelText("Message");
    expect(textarea).toHaveAttribute("autoCapitalize", "none");
    expect(textarea).toHaveAttribute("autoCorrect", "off");
    expect(textarea).toHaveAttribute("placeholder", "Details");
    expect(textarea).toHaveClass("min-h-[100px]");
  });

  it("renders label and container class", () => {
    render(<Textarea label="Message" containerClassName="space-y-4" />);

    expect(screen.getByText("Message")).toBeInTheDocument();
    expect(screen.getByText("Message").parentElement).toHaveClass("space-y-4");
  });

  it("forwards refs to the textarea element", () => {
    const ref = vi.fn();

    render(<Textarea ref={ref} />);

    expect(ref).toHaveBeenCalledWith(expect.any(HTMLTextAreaElement));
  });
});
