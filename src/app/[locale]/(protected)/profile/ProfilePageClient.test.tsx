import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useGetUsersMe } from "@/api/generated/profile/profile";
import { useGetWorkspacesMe } from "@/api/generated/workspace/workspace";
import { useToast } from "@/context/ToastContext";
import { useRouter } from "@/i18n/routing";
import { renderWithProviders } from "@/test/render";

import ProfilePage from "./ProfilePageClient";
import { useNotificationSettings } from "./_hooks/useNotificationSettings";
import { useProfileActions } from "./_hooks/useProfileActions";

vi.mock("@/api/generated/profile/profile", () => ({
  useGetUsersMe: vi.fn(),
}));

vi.mock("@/api/generated/workspace/workspace", () => ({
  useGetWorkspacesMe: vi.fn(),
}));

const replace = vi.fn();
vi.mock("@/i18n/routing", () => ({
  Link: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
  useRouter: vi.fn(() => ({
    replace,
  })),
}));

vi.mock("next/navigation", () => ({
  useParams: vi.fn(() => ({ workspaceId: "workspace-1" })),
}));

vi.mock("@/context/ToastContext", () => ({
  useToast: vi.fn(),
}));

vi.mock("./_components/LocaleSwitcher", () => ({
  LocaleSwitcher: () => <select aria-label="언어 설정" />,
}));

vi.mock("./_components/NotificationSettingControl", () => ({
  NotificationSettingControl: ({
    onSubscriptionChange,
  }: {
    onSubscriptionChange: (next: boolean) => void;
  }) => (
    <button type="button" onClick={() => onSubscriptionChange(true)}>
      enable notification
    </button>
  ),
}));

vi.mock("./_components/ProfileCoachmark", () => ({
  PROFILE_COACHMARK_PERSONAL_REMINDER_QUERY: "personal-reminder",
  ProfileCoachmark: ({ isRunning }: { isRunning: boolean }) => (
    <div data-testid="profile-coachmark">{isRunning ? "running" : "idle"}</div>
  ),
}));

vi.mock("./_hooks/useNotificationSettings", () => ({
  TIME_OPTIONS: ["09:00", "21:00"],
  useNotificationSettings: vi.fn(),
}));

vi.mock("./_hooks/useProfileActions", () => ({
  useProfileActions: vi.fn(),
}));

const showToast = vi.fn();
const changeNickname = vi.fn();
const logout = vi.fn();
const refreshSettings = vi.fn();
const updateDailySettings = vi.fn();

function mockProfile(
  overrides: Partial<ReturnType<typeof useGetUsersMe>> = {},
) {
  vi.mocked(useGetUsersMe).mockReturnValue({
    data: {
      data: {
        avatarKey: "avatar-blue",
        customId: "hong",
        id: 1,
        nickname: "홍길동",
      },
      status: 200,
    },
    isLoading: false,
    ...overrides,
  } as ReturnType<typeof useGetUsersMe>);
}

function mockWorkspace(
  overrides: Partial<ReturnType<typeof useGetWorkspacesMe>> = {},
) {
  vi.mocked(useGetWorkspacesMe).mockReturnValue({
    data: {
      data: {
        id: "workspace-1",
        name: "Dowin Team",
      },
      status: 200,
    },
    error: null,
    ...overrides,
  } as ReturnType<typeof useGetWorkspacesMe>);
}

function mockNotificationSettings(
  overrides: Partial<ReturnType<typeof useNotificationSettings>> = {},
) {
  vi.mocked(useNotificationSettings).mockReturnValue({
    dailySettings: {
      dailyReminderEnabled: true,
      dailyReminderTime: "21:00",
    },
    isDailyLoading: false,
    isUpdatingDaily: false,
    refreshSettings,
    updateDailySettings,
    ...overrides,
  } as ReturnType<typeof useNotificationSettings>);
}

function mockProfileActions(
  overrides: Partial<ReturnType<typeof useProfileActions>> = {},
) {
  vi.mocked(useProfileActions).mockReturnValue({
    changeNickname,
    changeWorkspaceName: vi.fn(),
    deleteWorkspace: vi.fn(),
    isActionPending: false,
    leaveWorkspace: vi.fn(),
    logout,
    pendingAction: null,
    ...overrides,
  } as ReturnType<typeof useProfileActions>);
}

describe("ProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, "", "/ko/workspace-1/profile");
    vi.mocked(useRouter).mockReturnValue({
      replace,
    } as unknown as ReturnType<typeof useRouter>);
    vi.mocked(useToast).mockReturnValue({
      showToast,
    });
    mockProfile();
    mockWorkspace();
    mockNotificationSettings();
    mockProfileActions();
  });

  it("renders loading skeleton while profile is loading", () => {
    mockProfile({
      data: undefined,
      isLoading: true,
    } as Partial<ReturnType<typeof useGetUsersMe>>);

    const { container } = renderWithProviders(<ProfilePage />);

    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("redirects to dashboard when the profile is missing after loading", async () => {
    mockProfile({
      data: undefined,
      isLoading: false,
    } as Partial<ReturnType<typeof useGetUsersMe>>);

    const { container } = renderWithProviders(<ProfilePage />);

    expect(container).toBeEmptyDOMElement();
    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith(
        "error",
        "프로필 정보를 불러오지 못해 홈으로 이동합니다.",
      );
      expect(replace).toHaveBeenCalledWith("/workspace-1/dashboard/my");
    });
  });

  it("renders profile summary and menu links without the disabled export surface", () => {
    renderWithProviders(<ProfilePage />);

    expect(screen.getByRole("heading", { name: "프로필" })).toBeInTheDocument();
    expect(screen.getByText("홍길동")).toBeInTheDocument();
    expect(screen.getByText("@hong")).toBeInTheDocument();
    expect(screen.getByLabelText("언어 설정")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /비밀번호 변경/ })).toHaveAttribute(
      "href",
      "/workspace-1/profile/password",
    );
    expect(screen.getByRole("link", { name: /서비스 탈퇴/ })).toHaveAttribute(
      "href",
      "/workspace-1/profile/delete-account",
    );
    expect(screen.getByRole("link", { name: /업데이트 노트/ })).toHaveAttribute(
      "href",
      "/workspace-1/profile/updates",
    );
    expect(screen.getByRole("link", { name: /문의하기/ })).toHaveAttribute(
      "href",
      "/workspace-1/profile/contact",
    );
    expect(screen.queryByText("CSV 다운로드")).not.toBeInTheDocument();
  });

  it("runs nickname and logout actions from menu rows", () => {
    renderWithProviders(<ProfilePage />);

    fireEvent.click(screen.getByRole("button", { name: /닉네임 변경/ }));
    fireEvent.click(screen.getByRole("button", { name: /로그아웃/ }));

    expect(changeNickname).toHaveBeenCalledTimes(1);
    expect(logout).toHaveBeenCalledTimes(1);
  });

  it("reveals daily reminder time control after notification subscription", () => {
    renderWithProviders(<ProfilePage />);

    expect(screen.queryByDisplayValue("21:00")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "enable notification" }));

    expect(refreshSettings).toHaveBeenCalledTimes(1);
    const reminderSelect = screen.getByDisplayValue("21:00");
    expect(reminderSelect).toHaveValue("21:00");

    fireEvent.change(reminderSelect, {
      target: {
        value: "09:00",
      },
    });

    expect(updateDailySettings).toHaveBeenCalledWith("09:00");
  });

  it("starts the personal reminder coachmark from the query string and cleans the URL", () => {
    window.history.replaceState(
      {},
      "",
      "/ko/workspace-1/profile?coachmark=personal-reminder",
    );

    renderWithProviders(<ProfilePage />);

    expect(screen.getByTestId("profile-coachmark")).toHaveTextContent("running");
    expect(window.location.search).toBe("");
  });

  it("shows pending overlay and disables row actions while profile action is pending", () => {
    mockProfileActions({
      isActionPending: true,
      pendingAction: "nickname",
    });

    renderWithProviders(<ProfilePage />);

    expect(screen.getByText("닉네임을 변경하는 중입니다.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /닉네임 변경/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /로그아웃/ })).toBeDisabled();
  });
});
