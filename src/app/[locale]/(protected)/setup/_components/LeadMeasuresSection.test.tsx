import { fireEvent, screen, within } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";

import type { MeasureInput } from "@/app/[locale]/(protected)/setup/_lib/measure";
import { renderWithProviders } from "@/test/render";

import { LeadMeasuresSection } from "./LeadMeasuresSection";

type LeadMeasuresSectionProps = ComponentProps<typeof LeadMeasuresSection>;

function createMeasure(overrides: Partial<MeasureInput> = {}): MeasureInput {
  return {
    dailyTargetCount: 1,
    existingId: null,
    id: "measure-1",
    initialStatus: null,
    isDeleted: false,
    name: "잠재고객 10명에게 연락하기",
    period: "WEEKLY",
    status: "ACTIVE",
    tags: [],
    targetValue: 3,
    trackingMode: "BOOLEAN",
    ...overrides,
  };
}

function renderLeadMeasuresSection(
  props: Partial<LeadMeasuresSectionProps> = {},
) {
  const callbacks = {
    addMeasureRow: vi.fn(),
    archiveMeasureRow: vi.fn(),
    createTag: vi.fn(async () => true),
    deleteTag: vi.fn(async () => true),
    handleMeasureChange: vi.fn(),
    reactivateMeasureRow: vi.fn(),
    removeMeasureRow: vi.fn(),
    renameTag: vi.fn(async () => true),
    restoreMeasureRow: vi.fn(),
    toggleMeasureTag: vi.fn(),
    moveMeasureRow: vi.fn(),
  };

  renderWithProviders(
    <LeadMeasuresSection
      availableTags={[]}
      coachmarkTarget={null}
      isMutating={false}
      isTagMutationPending={false}
      measures={[createMeasure()]}
      monthlyTargetMax={30}
      {...callbacks}
      {...props}
    />,
  );

  return callbacks;
}

describe("LeadMeasuresSection", () => {
  it("renders an active measure and adds another measure row", () => {
    const { addMeasureRow } = renderLeadMeasuresSection();

    expect(screen.getByText("액션 아이템 #1")).toBeInTheDocument();
    expect(screen.getByDisplayValue("잠재고객 10명에게 연락하기")).toBeInTheDocument();
    expect(screen.getAllByText("매주").length).toBeGreaterThan(0);
    expect(screen.getByText("3")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "액션 아이템 추가" }));

    expect(addMeasureRow).toHaveBeenCalledTimes(1);
  });

  it("updates name, period, tracking mode, and target value", () => {
    const { handleMeasureChange } = renderLeadMeasuresSection();

    fireEvent.change(screen.getByDisplayValue("잠재고객 10명에게 연락하기"), {
      target: {
        value: "신규 액션 아이템",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "매달" }));
    fireEvent.click(screen.getByRole("button", { name: "카운트형" }));
    fireEvent.click(screen.getByRole("button", { name: "횟수 증가" }));
    fireEvent.click(screen.getByRole("button", { name: "횟수 감소" }));

    expect(handleMeasureChange).toHaveBeenCalledWith(
      "measure-1",
      "name",
      "신규 액션 아이템",
    );
    expect(handleMeasureChange).toHaveBeenCalledWith(
      "measure-1",
      "period",
      "MONTHLY",
    );
    expect(handleMeasureChange).toHaveBeenCalledWith(
      "measure-1",
      "targetValue",
      1,
    );
    expect(handleMeasureChange).toHaveBeenCalledWith(
      "measure-1",
      "trackingMode",
      "COUNT",
    );
    expect(handleMeasureChange).toHaveBeenCalledWith(
      "measure-1",
      "targetValue",
      4,
    );
    expect(handleMeasureChange).toHaveBeenCalledWith(
      "measure-1",
      "targetValue",
      2,
    );
  });

  it("renders count-mode daily target controls", () => {
    const { handleMeasureChange } = renderLeadMeasuresSection({
      measures: [
        createMeasure({
          dailyTargetCount: 2,
          trackingMode: "COUNT",
        }),
      ],
    });

    expect(screen.getByText("하루에")).toBeInTheDocument();
    expect(screen.getByText("일")).toBeInTheDocument();

    const allButtons = screen.getAllByRole("button");
    const dailyDecrementButton = allButtons[8];
    const dailyIncrementButton = allButtons[9];

    fireEvent.click(dailyDecrementButton);
    fireEvent.click(dailyIncrementButton);

    expect(handleMeasureChange).toHaveBeenCalledWith(
      "measure-1",
      "dailyTargetCount",
      1,
    );
    expect(handleMeasureChange).toHaveBeenCalledWith(
      "measure-1",
      "dailyTargetCount",
      3,
    );
  });

  it("disables weekly target boundaries", () => {
    renderLeadMeasuresSection({
      measures: [
        createMeasure({
          targetValue: 1,
        }),
      ],
    });

    expect(screen.getByRole("button", { name: "횟수 감소" })).toBeDisabled();

    renderLeadMeasuresSection({
      measures: [
        createMeasure({
          id: "measure-2",
          targetValue: 7,
        }),
      ],
    });

    expect(screen.getAllByRole("button", { name: "횟수 증가" })[1]).toBeDisabled();
  });

  it("archives existing measures and deletes removable rows", () => {
    const { archiveMeasureRow, removeMeasureRow } = renderLeadMeasuresSection({
      measures: [
        createMeasure({
          existingId: 10,
        }),
        createMeasure({
          id: "measure-2",
          name: "두 번째 액션 아이템",
        }),
      ],
    });

    fireEvent.click(screen.getByRole("button", { name: "보관" }));
    fireEvent.click(screen.getAllByRole("button", { name: "삭제" })[0]);
    fireEvent.click(screen.getAllByRole("button", { name: "삭제" })[1]);

    expect(archiveMeasureRow).toHaveBeenCalledWith("measure-1");
    expect(removeMeasureRow).toHaveBeenCalledWith("measure-1");
    expect(removeMeasureRow).toHaveBeenCalledWith("measure-2");
  });

  it("does not allow archiving the only active existing measure", () => {
    renderLeadMeasuresSection({
      measures: [
        createMeasure({
          existingId: 10,
        }),
      ],
    });

    expect(screen.getByRole("button", { name: "보관" })).toBeDisabled();
  });

  it("renders deleted active rows with restore action", () => {
    const { restoreMeasureRow } = renderLeadMeasuresSection({
      measures: [
        createMeasure({
          isDeleted: true,
          name: "삭제할 액션 아이템",
        }),
      ],
    });

    expect(screen.getByText("삭제 예정")).toBeInTheDocument();
    expect(screen.getByText("삭제할 액션 아이템")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "삭제 취소" }));

    expect(restoreMeasureRow).toHaveBeenCalledWith("measure-1");
  });

  it("renders archived measures and wires reactivate/delete actions", () => {
    const { reactivateMeasureRow, removeMeasureRow } = renderLeadMeasuresSection({
      measures: [
        createMeasure(),
        createMeasure({
          id: "archived-1",
          name: "보관된 액션 아이템",
          period: "MONTHLY",
          status: "ARCHIVED",
          tags: [{ id: 1, name: "영업" }],
          targetValue: 5,
        }),
      ],
    });

    const archivedItemTitle = screen.getAllByText("보관된 액션 아이템")[1];
    const archivedSection = archivedItemTitle.closest(
      "div.flex.flex-col.gap-3",
    );
    expect(screen.getByText("5회 / 월")).toBeInTheDocument();
    expect(screen.getByText("#영업")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /다시 활성화/ }));
    fireEvent.click(
      within((archivedSection as HTMLElement | null) ?? document.body).getByRole("button", {
        name: /삭제/,
      }),
    );

    expect(reactivateMeasureRow).toHaveBeenCalledWith("archived-1");
    expect(removeMeasureRow).toHaveBeenCalledWith("archived-1");
  });

  it("renders deleted archived measures with restore action", () => {
    const { restoreMeasureRow } = renderLeadMeasuresSection({
      measures: [
        createMeasure(),
        createMeasure({
          id: "archived-deleted",
          isDeleted: true,
          name: "삭제 예정 보관 항목",
          status: "ARCHIVED",
        }),
      ],
    });

    expect(screen.getAllByText("삭제 예정").length).toBeGreaterThan(0);
    expect(screen.getByText("삭제 예정 보관 항목")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "삭제 취소" }));

    expect(restoreMeasureRow).toHaveBeenCalledWith("archived-deleted");
  });

  it("disables add and row controls while mutating", () => {
    renderLeadMeasuresSection({
      isMutating: true,
      measures: [
        createMeasure({
          existingId: 10,
        }),
        createMeasure({
          id: "measure-2",
          name: "두 번째 액션 아이템",
        }),
      ],
    });

    expect(screen.getByDisplayValue("잠재고객 10명에게 연락하기")).toBeDisabled();
    expect(screen.getByRole("button", { name: "액션 아이템 추가" })).toBeDisabled();
    screen
      .getAllByRole("button")
      .forEach((button) => expect(button).toBeDisabled());
  });
});
