import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PasswordInput } from "./PasswordInput";

describe("PasswordInput", () => {
  it("renders as a password field by default", () => {
    render(<PasswordInput aria-label="Password" />);

    expect(screen.getByLabelText("Password")).toHaveAttribute(
      "type",
      "password",
    );
  });

  it("toggles password visibility without submitting the parent form", () => {
    render(
      <form>
        <PasswordInput aria-label="Password" />
      </form>,
    );

    const input = screen.getByLabelText("Password");
    const toggleButton = screen.getByRole("button");

    expect(toggleButton).toHaveAttribute("type", "button");

    fireEvent.click(toggleButton);
    expect(input).toHaveAttribute("type", "text");

    fireEvent.click(toggleButton);
    expect(input).toHaveAttribute("type", "password");
  });
});
