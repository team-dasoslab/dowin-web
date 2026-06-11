import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Switch } from "./Switch";

describe("Switch", () => {
  it("renders unchecked by default", () => {
    render(<Switch aria-label="Notifications" />);

    const switchButton = screen.getByRole("switch", {
      name: "Notifications",
    });
    expect(switchButton).toHaveAttribute("aria-checked", "false");
    expect(switchButton).toHaveClass("bg-border");
  });

  it("reports the next checked state when clicked", () => {
    const onCheckedChange = vi.fn();
    const onClick = vi.fn();

    render(
      <Switch
        aria-label="Notifications"
        checked
        onCheckedChange={onCheckedChange}
        onClick={onClick}
      />,
    );

    fireEvent.click(screen.getByRole("switch", { name: "Notifications" }));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onCheckedChange).toHaveBeenCalledWith(false);
  });

  it("does not call onCheckedChange while disabled", () => {
    const onCheckedChange = vi.fn();

    render(
      <Switch
        aria-label="Notifications"
        checked={false}
        disabled
        onCheckedChange={onCheckedChange}
      />,
    );

    const switchButton = screen.getByRole("switch", {
      name: "Notifications",
    });
    expect(switchButton).toBeDisabled();

    fireEvent.click(switchButton);

    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});
