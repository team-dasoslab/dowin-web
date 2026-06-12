import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/render";

import SetupPage from "./SetupPageClient";
import { useScoreboardSetup } from "./_hooks/useScoreboardSetup";

vi.mock("react-joyride", () => ({
  Joyride: () => null,
}));

vi.mock("@/i18n/routing", () => ({
  useRouter: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useParams: vi.fn(),
}));

vi.mock("./_hooks/useScoreboardSetup", () => ({
  useScoreboardSetup: vi.fn(),
}));

const routerPush = vi.fn();
const storage = new Map<string, string>();

function createBaseSetupState() {
  return {
    activeTooltip: null,
    addMeasureRow: vi.fn(),
    archive: vi.fn(async () => true),
    archiveMeasureRow: vi.fn(),
    availableTags: [],
    createTag: vi.fn(async () => true),
    deleteTag: vi.fn(async () => true),
    goalName: "분기 매출 1억원 만들기",
    handleMeasureChange: vi.fn(),
    isArchivePending: false,
    isEditMode: false,
    isInitializing: false,
    isRedirecting: false,
    isSubmitPending: false,
    isTagMutationPending: false,
    lagMeasure: "월 매출 3천만원에서 1억원으로",
    measures: [
      {
        dailyTargetCount: 1,
        existingId: null,
        id: "measure-1",
        initialStatus: null,
        name: "잠재고객 10명에게 연락하기",
        period: "WEEKLY" as const,
        status: "ACTIVE" as const,
        tags: [],
        targetValue: 3,
        trackingMode: "BOOLEAN" as const,
      },
    ],
    monthlyTargetMax: 30,
    reactivateMeasureRow: vi.fn(),
    removeMeasureRow: vi.fn(),
    renameTag: vi.fn(async () => true),
    restoreMeasureRow: vi.fn(),
    setActiveTooltip: vi.fn(),
    setGoalName: vi.fn(),
    setLagMeasure: vi.fn(),
    submit: vi.fn(async () => false),
    toggleMeasureTag: vi.fn(),
  };
}

type SetupState = ReturnType<typeof createBaseSetupState>;

function createSetupState(overrides: Partial<SetupState> = {}) {
  return {
    ...createBaseSetupState(),
    ...overrides,
  };
}

describe("SetupPage", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    storage.clear();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: vi.fn((key: string) => storage.get(key) ?? null),
        removeItem: vi.fn((key: string) => {
          storage.delete(key);
        }),
        setItem: vi.fn((key: string, value: string) => {
          storage.set(key, value);
        }),
      },
    });
    window.localStorage.setItem("dowin.setup.coachmark.v1.dismissed", "1");

    const routing = await import("@/i18n/routing");
    vi.mocked(routing.useRouter).mockReturnValue({
      push: routerPush,
    } as unknown as ReturnType<typeof routing.useRouter>);

    const navigation = await import("next/navigation");
    vi.mocked(navigation.useParams).mockReturnValue({
      workspaceId: "workspace-1",
    });
  });

  it("renders the create setup screen from hook state", () => {
    vi.mocked(useScoreboardSetup).mockReturnValue(createSetupState());

    renderWithProviders(<SetupPage />);

    expect(
      screen.getByRole("heading", { name: "새 점수판 생성하기" }),
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("분기 매출 1억원 만들기"),
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("월 매출 3천만원에서 1억원으로"),
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("잠재고객 10명에게 연락하기"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "점수판 생성" }),
    ).toBeInTheDocument();
  });

  it("renders the loading skeleton while setup is initializing", () => {
    vi.mocked(useScoreboardSetup).mockReturnValue(
      createSetupState({ isInitializing: true }),
    );

    const { container } = renderWithProviders(<SetupPage />);

    expect(
      screen.queryByRole("heading", { name: "새 점수판 생성하기" }),
    ).not.toBeInTheDocument();
    expect(container.querySelectorAll(".bg-zinc-200").length).toBeGreaterThan(
      0,
    );
  });

  it("wires setup form fields to hook handlers", () => {
    const state = createSetupState();
    vi.mocked(useScoreboardSetup).mockReturnValue(state);

    renderWithProviders(<SetupPage />);

    fireEvent.change(screen.getByDisplayValue("분기 매출 1억원 만들기"), {
      target: { value: "신규 목표" },
    });
    fireEvent.change(screen.getByDisplayValue("월 매출 3천만원에서 1억원으로"), {
      target: { value: "신규 성공 기준" },
    });
    fireEvent.change(screen.getByDisplayValue("잠재고객 10명에게 연락하기"), {
      target: { value: "신규 액션 아이템" },
    });

    expect(state.setGoalName).toHaveBeenCalledWith("신규 목표");
    expect(state.setLagMeasure).toHaveBeenCalledWith("신규 성공 기준");
    expect(state.handleMeasureChange).toHaveBeenCalledWith(
      "measure-1",
      "name",
      "신규 액션 아이템",
    );
  });

  it("wires lead measure period and target controls", () => {
    const state = createSetupState();
    vi.mocked(useScoreboardSetup).mockReturnValue(state);

    renderWithProviders(<SetupPage />);

    fireEvent.click(screen.getByRole("button", { name: "매달" }));
    fireEvent.click(screen.getByRole("button", { name: "횟수 증가" }));
    fireEvent.click(screen.getByRole("button", { name: "액션 아이템 추가" }));

    expect(state.handleMeasureChange).toHaveBeenCalledWith(
      "measure-1",
      "period",
      "MONTHLY",
    );
    expect(state.handleMeasureChange).toHaveBeenCalledWith(
      "measure-1",
      "targetValue",
      1,
    );
    expect(state.handleMeasureChange).toHaveBeenCalledWith(
      "measure-1",
      "targetValue",
      4,
    );
    expect(state.addMeasureRow).toHaveBeenCalledTimes(1);
  });

  it("renders edit mode with manage section", () => {
    vi.mocked(useScoreboardSetup).mockReturnValue(
      createSetupState({ isEditMode: true }),
    );

    renderWithProviders(<SetupPage />);

    expect(
      screen.getByRole("heading", { name: "점수판 관리" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "변경사항 저장" }),
    ).toBeInTheDocument();
    expect(screen.getByText("점수판 보관")).toBeInTheDocument();
  });

  it("shows the mutating overlay and disables submission while pending", () => {
    vi.mocked(useScoreboardSetup).mockReturnValue(
      createSetupState({ isSubmitPending: true }),
    );

    renderWithProviders(<SetupPage />);

    expect(
      screen.getByText("점수판을 생성하고 있습니다..."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "" })).toBeDisabled();
  });

  it("navigates to the workspace dashboard after a successful submit", async () => {
    const state = createSetupState({
      submit: vi.fn(async () => true),
    });
    vi.mocked(useScoreboardSetup).mockReturnValue(state);

    const { container } = renderWithProviders(<SetupPage />);
    const form = container.querySelector("#setup-form");
    expect(form).not.toBeNull();

    fireEvent.submit(form as HTMLFormElement);

    await waitFor(() => {
      expect(state.submit).toHaveBeenCalledTimes(1);
      expect(routerPush).toHaveBeenCalledWith("/workspace-1/dashboard/my");
    });
  });
});
