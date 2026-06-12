import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/render";

import { GoalSection } from "./GoalSection";
import { LagMeasureSection } from "./LagMeasureSection";
import { SetupManageSection } from "./SetupManageSection";
import { SetupSubmitButton } from "./SetupSubmitButton";

describe("setup basic sections", () => {
  it("renders goal input and sends changes to the caller", () => {
    const setGoalName = vi.fn();

    renderWithProviders(
      <GoalSection
        goalName="분기 매출 1억원 만들기"
        isMutating={false}
        setGoalName={setGoalName}
      />,
    );

    const input = screen.getByDisplayValue("분기 매출 1억원 만들기");
    expect(screen.getByText("가장 중요한 목표는 무엇인가요?")).toBeInTheDocument();
    expect(input).toBeRequired();

    fireEvent.change(input, {
      target: {
        value: "신규 목표",
      },
    });

    expect(setGoalName).toHaveBeenCalledWith("신규 목표");
  });

  it("disables the goal input while mutating", () => {
    renderWithProviders(
      <GoalSection
        goalName="분기 매출 1억원 만들기"
        isMutating
        setGoalName={vi.fn()}
      />,
    );

    expect(screen.getByDisplayValue("분기 매출 1억원 만들기")).toBeDisabled();
  });

  it("renders success criteria input and sends changes to the caller", () => {
    const setLagMeasure = vi.fn();

    renderWithProviders(
      <LagMeasureSection
        isMutating={false}
        lagMeasure="월 매출 3천만원에서 1억원으로"
        setLagMeasure={setLagMeasure}
      />,
    );

    const input = screen.getByDisplayValue("월 매출 3천만원에서 1억원으로");
    expect(
      screen.getByText("성공을 어떻게 측정할 건가요? (X → Y)"),
    ).toBeInTheDocument();
    expect(input).toBeRequired();

    fireEvent.change(input, {
      target: {
        value: "신규 성공 기준",
      },
    });

    expect(setLagMeasure).toHaveBeenCalledWith("신규 성공 기준");
  });

  it("renders create, edit, and pending submit states", () => {
    const { rerender } = renderWithProviders(
      <SetupSubmitButton
        formId="setup-form"
        isEditMode={false}
        isMutating={false}
        isSubmitPending={false}
      />,
    );

    expect(screen.getByRole("button", { name: "점수판 생성" })).toHaveAttribute(
      "form",
      "setup-form",
    );

    rerender(
      <SetupSubmitButton
        formId="setup-form"
        isEditMode
        isMutating={false}
        isSubmitPending={false}
      />,
    );
    expect(screen.getByRole("button", { name: "변경사항 저장" })).toBeEnabled();

    rerender(
      <SetupSubmitButton
        formId="setup-form"
        isEditMode
        isMutating
        isSubmitPending
      />,
    );
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("archives only after confirmation", () => {
    const archive = vi.fn(async () => true);
    vi.spyOn(window, "confirm").mockReturnValue(true);

    renderWithProviders(
      <SetupManageSection archive={archive} isArchivePending={false} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "보관" }));

    expect(window.confirm).toHaveBeenCalledWith(
      "이 점수판을 보관하시겠습니까?",
    );
    expect(archive).toHaveBeenCalledTimes(1);
  });

  it("does not archive when confirmation is cancelled", () => {
    const archive = vi.fn(async () => true);
    vi.spyOn(window, "confirm").mockReturnValue(false);

    renderWithProviders(
      <SetupManageSection archive={archive} isArchivePending={false} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "보관" }));

    expect(archive).not.toHaveBeenCalled();
  });

  it("disables archive action while archive is pending", () => {
    renderWithProviders(
      <SetupManageSection archive={vi.fn(async () => true)} isArchivePending />,
    );

    expect(screen.getByRole("button", { name: /보관 중/ })).toBeDisabled();
  });
});
