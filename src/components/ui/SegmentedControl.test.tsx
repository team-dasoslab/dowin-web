import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SegmentedControl } from "./SegmentedControl";

const options = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
] as const;

describe("SegmentedControl", () => {
  it("marks the selected option and calls onChange with the clicked value", () => {
    const onChange = vi.fn();

    render(
      <SegmentedControl
        options={options}
        value="week"
        onChange={onChange}
      />,
    );

    expect(screen.getByRole("button", { name: "Week" })).toHaveClass(
      "bg-zinc-950",
    );
    expect(screen.getByRole("button", { name: "Month" })).toHaveClass(
      "text-text-muted",
    );

    fireEvent.click(screen.getByRole("button", { name: "Month" }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("month");
  });

  it("disables every option when disabled", () => {
    const onChange = vi.fn();

    render(
      <SegmentedControl
        options={options}
        value="week"
        onChange={onChange}
        disabled
      />,
    );

    const monthButton = screen.getByRole("button", { name: "Month" });
    expect(monthButton).toBeDisabled();

    fireEvent.click(monthButton);

    expect(onChange).not.toHaveBeenCalled();
  });
});
