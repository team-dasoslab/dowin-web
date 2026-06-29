import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useGetUsersMe } from "@/api/generated/profile/profile";
import {
  useGetWorkspaces,
  useGetWorkspacesMe,
  usePutWorkspacesCurrent,
  usePutWorkspacesId,
} from "@/api/generated/workspace/workspace";
import { useProfileActions } from "@/app/[locale]/(protected)/profile/_hooks/useProfileActions";
import { useToast } from "@/context/ToastContext";
import { useRouter } from "@/i18n/routing";
import { renderWithProviders } from "@/test/render";

import WorkspaceSettingsPage from "./WorkspaceSettingsPageClient";

vi.mock("@/api/generated/profile/profile", () => ({
  useGetUsersMe: vi.fn(),
}));

vi.mock("@/api/generated/workspace/workspace", () => ({
  useGetWorkspaces: vi.fn(),
  useGetWorkspacesMe: vi.fn(),
  usePutWorkspacesCurrent: vi.fn(),
  usePutWorkspacesId: vi.fn(),
  getGetWorkspacesMeQueryKey: vi.fn(() => ["workspaces", "me"]),
  getGetWorkspacesQueryKey: vi.fn(() => ["workspaces"]),
}));

vi.mock("@/api/generated/team-checkins/team-checkins", () => ({
  useGetWorkspacesWorkspaceIdTeamCheckinsSettings: vi.fn(),
  usePutWorkspacesWorkspaceIdTeamCheckinsSettings: vi.fn(),
  getGetWorkspacesWorkspaceIdTeamCheckinsSettingsQueryKey: vi.fn(() => ["team-checkins"]),
}));

vi.mock("@/app/[locale]/(protected)/profile/_hooks/useProfileActions", () => ({
  useProfileActions: vi.fn(),
}));

vi.mock("@/config/public-runtime-config", () => ({
  publicRuntimeConfig: {
    isDevelopment: false,
    nextPublicGaId: "",
    nodeEnv: "test",
  },
}));

const replace = vi.fn();
const refresh = vi.fn();

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
    refresh,
    replace,
  })),
}));

vi.mock("next/navigation", () => ({
  useParams: vi.fn(() => ({ workspaceId: "workspace-1" })),
}));

vi.mock("@/context/ToastContext", () => ({
  useToast: vi.fn(),
}));

const showToast = vi.fn();
const changeWorkspaceName = vi.fn();
const deleteWorkspace = vi.fn();
const leaveWorkspace = vi.fn();
const switchWorkspace = vi.fn();

function mockProfile(
  overrides: Partial<ReturnType<typeof useGetUsersMe>> = {},
) {
  vi.mocked(useGetUsersMe).mockReturnValue({
    data: {
      data: {
        id: 1,
        nickname: "관리자",
        role: "ADMIN",
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
        freeMemberLimit: 10,
        id: "workspace-1",
        isOverFreeMemberLimit: false,
        memberCount: 3,
        name: "Dowin Team",
        role: "ADMIN",
      },
      status: 200,
    },
    error: null,
    isLoading: false,
    ...overrides,
  } as ReturnType<typeof useGetWorkspacesMe>);
}

function mockWorkspaces(
  overrides: Partial<ReturnType<typeof useGetWorkspaces>> = {},
) {
  vi.mocked(useGetWorkspaces).mockReturnValue({
    data: {
      data: [
        {
          id: "workspace-1",
          name: "Dowin Team",
          role: "ADMIN",
        },
        {
          id: "workspace-2",
          name: "Ops Team",
          role: "MEMBER",
        },
      ],
      status: 200,
    },
    ...overrides,
  } as ReturnType<typeof useGetWorkspaces>);
}

function mockProfileActions(
  overrides: Partial<ReturnType<typeof useProfileActions>> = {},
) {
  vi.mocked(useProfileActions).mockReturnValue({
    changeNickname: vi.fn(),
    changeWorkspaceName,
    deleteWorkspace,
    isActionPending: false,
    leaveWorkspace,
    logout: vi.fn(),
    pendingAction: null,
    ...overrides,
  } as ReturnType<typeof useProfileActions>);
}

describe("WorkspaceSettingsPage", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      refresh,
      replace,
    } as unknown as ReturnType<typeof useRouter>);
    vi.mocked(useToast).mockReturnValue({
      showToast,
    });
    vi.mocked(usePutWorkspacesCurrent).mockReturnValue({
      isPending: false,
      mutate: switchWorkspace,
    } as unknown as ReturnType<typeof usePutWorkspacesCurrent>);
    vi.mocked(usePutWorkspacesId).mockReturnValue({
      isPending: false,
      mutateAsync: vi.fn(),
    } as unknown as ReturnType<typeof usePutWorkspacesId>);
    
    // team-checkins
    const { useGetWorkspacesWorkspaceIdTeamCheckinsSettings, usePutWorkspacesWorkspaceIdTeamCheckinsSettings } = await import("@/api/generated/team-checkins/team-checkins");
    vi.mocked(useGetWorkspacesWorkspaceIdTeamCheckinsSettings).mockReturnValue({
      data: { data: { enabled: true, sendHour: 10 } },
      status: 200,
    } as unknown as ReturnType<typeof useGetWorkspacesWorkspaceIdTeamCheckinsSettings>);
    vi.mocked(usePutWorkspacesWorkspaceIdTeamCheckinsSettings).mockReturnValue({
      isPending: false,
      mutateAsync: vi.fn(),
    } as unknown as ReturnType<typeof usePutWorkspacesWorkspaceIdTeamCheckinsSettings>);
    mockProfile();
    mockWorkspace();
    mockWorkspaces();
    mockProfileActions();
  });

  it("renders loading skeleton while profile or workspace is loading", () => {
    mockProfile({
      isLoading: true,
    } as Partial<ReturnType<typeof useGetUsersMe>>);

    const { container } = renderWithProviders(<WorkspaceSettingsPage />);

    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("redirects away when there is no active workspace", async () => {
    mockWorkspace({
      data: undefined,
      error: {
        response: {
          status: 404,
        },
      },
    } as Partial<ReturnType<typeof useGetWorkspacesMe>>);

    const { container } = renderWithProviders(<WorkspaceSettingsPage />);

    expect(container).toBeEmptyDOMElement();
    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith(
        "error",
        "소속된 워크스페이스가 없습니다.",
      );
      expect(replace).toHaveBeenCalledWith("/");
    });
  });

  it("renders admin workspace settings without the disabled leader report link", () => {
    renderWithProviders(<WorkspaceSettingsPage />);

    expect(
      screen.getByRole("heading", { name: "워크스페이스" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Dowin Team").length).toBeGreaterThan(0);
    expect(screen.getAllByText("워크스페이스 관리자").length).toBeGreaterThan(0);
    expect(screen.getByText("Basic")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /플랜 및 결제/ })).toHaveAttribute(
      "href",
      "/workspace-1/workspace/billing",
    );
    expect(screen.getByRole("link", { name: /멤버 관리/ })).toHaveAttribute(
      "href",
      "/workspace-1/workspace/members",
    );
    expect(screen.getByRole("link", { name: /초대코드 관리/ })).toHaveAttribute(
      "href",
      "/workspace-1/workspace/invites",
    );
    expect(
      screen.queryByRole("link", { name: /주간 리포트/ }),
    ).not.toBeInTheDocument();
  });

  it("runs admin workspace actions from menu rows", () => {
    renderWithProviders(<WorkspaceSettingsPage />);

    fireEvent.click(screen.getByRole("button", { name: /워크스페이스 이름 변경/ }));
    fireEvent.click(screen.getByRole("button", { name: /워크스페이스 삭제/ }));

    expect(changeWorkspaceName).toHaveBeenCalledTimes(1);
    expect(deleteWorkspace).toHaveBeenCalledTimes(1);
  });

  it("renders only leave action for non-admin workspace members", () => {
    mockWorkspace({
      data: {
        data: {
          freeMemberLimit: 10,
          id: "workspace-1",
          isOverFreeMemberLimit: false,
          memberCount: 3,
          name: "Dowin Team",
          role: "MEMBER",
        },
        status: 200,
      },
    });

    renderWithProviders(<WorkspaceSettingsPage />);

    expect(screen.getAllByText("워크스페이스 멤버").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /워크스페이스 탈퇴/ })).toBeEnabled();
    expect(
      screen.queryByRole("link", { name: /멤버 관리/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /초대코드 관리/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /워크스페이스 삭제/ }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /워크스페이스 탈퇴/ }));

    expect(leaveWorkspace).toHaveBeenCalledTimes(1);
  });

  it("renders workspace list and switches to another workspace", () => {
    renderWithProviders(<WorkspaceSettingsPage />);

    expect(screen.getAllByText("Dowin Team").length).toBeGreaterThan(0);
    expect(screen.getByText("Ops Team")).toBeInTheDocument();
    expect(screen.getByText("현재")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /새 워크스페이스 만들기/ }),
    ).toHaveAttribute("href", "/workspace/new");

    fireEvent.click(screen.getByRole("button", { name: "전환" }));

    expect(switchWorkspace).toHaveBeenCalledWith({
      data: {
        workspaceId: "workspace-2",
      },
    });
  });

  it("shows pending overlay and disables actions while an action is pending", () => {
    mockProfileActions({
      isActionPending: true,
      pendingAction: "workspace-name",
    });

    renderWithProviders(<WorkspaceSettingsPage />);

    expect(
      screen.getByText("워크스페이스 이름을 변경하는 중입니다."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /워크스페이스 이름 변경/ }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "전환" })).toBeDisabled();
  });
});
