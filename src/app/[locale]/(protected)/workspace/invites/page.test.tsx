import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useGetUsersMe } from "@/api/generated/profile/profile";
import {
  useGetWorkspacesIdInvites,
  useGetWorkspacesMe,
} from "@/api/generated/workspace/workspace";
import { renderWithProviders } from "@/test/render";

import ProfileInvitesPage from "./page";
import { useInviteActions } from "./_hooks/useInviteActions";

vi.mock("@/api/generated/profile/profile", () => ({
  useGetUsersMe: vi.fn(),
}));

vi.mock("@/api/generated/workspace/workspace", () => ({
  useGetWorkspacesIdInvites: vi.fn(),
  useGetWorkspacesMe: vi.fn(),
}));

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
}));

vi.mock("next/navigation", () => ({
  useParams: vi.fn(() => ({ workspaceId: "workspace-1" })),
}));

vi.mock("./_hooks/useInviteActions", () => ({
  useInviteActions: vi.fn(),
}));

const createInvite = vi.fn();
const copyInviteCode = vi.fn();
const toggleInviteStatus = vi.fn();

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
        myRole: "ADMIN",
        name: "Dowin Team",
      },
      status: 200,
    },
    error: null,
    isLoading: false,
    ...overrides,
  } as ReturnType<typeof useGetWorkspacesMe>);
}

function mockInvites(
  overrides: Partial<ReturnType<typeof useGetWorkspacesIdInvites>> = {},
) {
  vi.mocked(useGetWorkspacesIdInvites).mockReturnValue({
    data: {
      data: [
        {
          code: "OLD-INACTIVE",
          id: 20,
          maxUses: 3,
          status: "INACTIVE",
          usedCount: 1,
        },
        {
          code: "NEW-ACTIVE",
          id: 30,
          maxUses: 5,
          status: "ACTIVE",
          usedCount: 2,
        },
      ],
      status: 200,
    },
    isLoading: false,
    ...overrides,
  } as ReturnType<typeof useGetWorkspacesIdInvites>);
}

function mockInviteActions(
  overrides: Partial<ReturnType<typeof useInviteActions>> = {},
) {
  vi.mocked(useInviteActions).mockReturnValue({
    copiedInviteId: null,
    copyInviteCode,
    createInvite,
    isCreatingInvite: false,
    pendingToggleInviteId: null,
    toggleInviteStatus,
    ...overrides,
  } as ReturnType<typeof useInviteActions>);
}

describe("ProfileInvitesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProfile();
    mockWorkspace();
    mockInvites();
    mockInviteActions();
  });

  it("renders loading skeleton while profile, workspace, or invites are loading", () => {
    mockInvites({
      isLoading: true,
    } as Partial<ReturnType<typeof useGetWorkspacesIdInvites>>);

    const { container } = renderWithProviders(<ProfileInvitesPage />);

    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("renders no-workspace state with workspace actions", () => {
    mockWorkspace({
      data: undefined,
      error: {
        response: {
          status: 404,
        },
      },
    } as Partial<ReturnType<typeof useGetWorkspacesMe>>);

    renderWithProviders(<ProfileInvitesPage />);

    expect(screen.getByText("워크스페이스가 없어요")).toBeInTheDocument();
    expect(
      screen.getByText("초대코드 관리는 워크스페이스를 만든 뒤 사용할 수 있습니다."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "새 워크스페이스 만들기" })).toHaveAttribute(
      "href",
      "/workspace/new",
    );
    expect(screen.getByRole("link", { name: "초대코드로 참가하기" })).toHaveAttribute(
      "href",
      "/workspace/join",
    );
  });

  it("blocks non-admin users from invite management", () => {
    mockProfile({
      data: {
        data: {
          id: 2,
          nickname: "일반 멤버",
          role: "MEMBER",
        },
        status: 200,
      },
    });

    renderWithProviders(<ProfileInvitesPage />);

    expect(screen.getByText("관리자만 접근할 수 있어요")).toBeInTheDocument();
    expect(
      screen.getByText(
        "초대코드 생성/상태 변경은 현재 워크스페이스의 관리자만 할 수 있습니다.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "설정으로 돌아가기" })).toHaveAttribute(
      "href",
      "/workspace-1/profile",
    );
    expect(useGetWorkspacesIdInvites).toHaveBeenCalledWith(
      "workspace-1",
      expect.objectContaining({
        query: expect.objectContaining({
          enabled: false,
        }),
      }),
    );
  });

  it("renders workspace summary, sorted invites, usage labels, and copied state", () => {
    mockInviteActions({
      copiedInviteId: 30,
    });

    renderWithProviders(<ProfileInvitesPage />);

    expect(screen.getByRole("heading", { name: "초대코드 관리" })).toBeInTheDocument();
    expect(screen.getByText("Dowin Team")).toBeInTheDocument();
    expect(screen.getByText("전체 2개 코드, 현재 활성 1개")).toBeInTheDocument();
    expect(screen.getByText("새 초대코드 만들기")).toBeInTheDocument();
    expect(screen.getByText("초대코드 목록")).toBeInTheDocument();
    expect(screen.getByText("사용량 2 / 5")).toBeInTheDocument();
    expect(screen.getByText("사용량 1 / 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /복사 완료/ })).toBeInTheDocument();

    const inviteCodes = screen.getAllByText(/NEW-ACTIVE|OLD-INACTIVE/);
    expect(inviteCodes.map((node) => node.textContent)).toEqual([
      "NEW-ACTIVE",
      "OLD-INACTIVE",
    ]);
  });

  it("creates invites with the validated input and preset values", () => {
    renderWithProviders(<ProfileInvitesPage />);

    fireEvent.click(screen.getByRole("button", { name: "초대코드 생성" }));
    expect(createInvite).toHaveBeenCalledWith(3);

    fireEvent.click(screen.getByRole("button", { name: "5회" }));
    fireEvent.click(screen.getByRole("button", { name: "초대코드 생성" }));
    expect(createInvite).toHaveBeenLastCalledWith(5);
  });

  it("shows validation errors before creating an invite", () => {
    renderWithProviders(<ProfileInvitesPage />);

    fireEvent.change(screen.getByRole("spinbutton"), {
      target: {
        value: "1000",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "초대코드 생성" }));

    expect(createInvite).not.toHaveBeenCalled();
    expect(screen.getByText("사용 횟수는 999 이하여야 합니다.")).toBeInTheDocument();
  });

  it("passes copy and status toggle actions to the invite actions hook", () => {
    renderWithProviders(<ProfileInvitesPage />);

    fireEvent.click(screen.getAllByRole("button", { name: /코드 복사/ })[0]);
    fireEvent.click(screen.getByRole("switch", { name: "비활성" }));
    fireEvent.click(screen.getByRole("switch", { name: "활성" }));

    expect(copyInviteCode).toHaveBeenCalledWith(30, "NEW-ACTIVE");
    expect(toggleInviteStatus).toHaveBeenCalledWith(30, "INACTIVE");
    expect(toggleInviteStatus).toHaveBeenCalledWith(20, "ACTIVE");
  });

  it("filters invites by active and inactive status", () => {
    renderWithProviders(<ProfileInvitesPage />);

    fireEvent.click(screen.getByRole("button", { name: "활성" }));
    expect(screen.getByText("NEW-ACTIVE")).toBeInTheDocument();
    expect(screen.queryByText("OLD-INACTIVE")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "비활성" }));
    expect(screen.queryByText("NEW-ACTIVE")).not.toBeInTheDocument();
    expect(screen.getByText("OLD-INACTIVE")).toBeInTheDocument();
  });

  it("disables create and inactive invite activation while over the member limit", () => {
    mockWorkspace({
      data: {
        data: {
          freeMemberLimit: 2,
          id: "workspace-1",
          isOverFreeMemberLimit: true,
          memberCount: 3,
          myRole: "ADMIN",
          name: "Dowin Team",
        },
        status: 200,
      },
    });

    renderWithProviders(<ProfileInvitesPage />);

    expect(screen.getByRole("button", { name: "초대코드 생성" })).toBeDisabled();
    expect(
      screen.getByText(
        "좌석 한도 초과 상태에서는 새 초대코드를 만들 수 없습니다. 멤버 수를 줄이거나 결제 관리에서 좌석 상태를 확인해주세요.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "활성" })).toBeDisabled();
    expect(screen.getByRole("switch", { name: "비활성" })).toBeEnabled();
    expect(
      screen.getByText("현재 한도 초과로 이 코드는 참가에 사용할 수 없습니다."),
    ).toBeInTheDocument();
  });

  it("renders empty invites state", () => {
    mockInvites({
      data: {
        data: [],
        status: 200,
      },
    } as Partial<ReturnType<typeof useGetWorkspacesIdInvites>>);

    renderWithProviders(<ProfileInvitesPage />);

    expect(screen.getByText("아직 생성된 초대코드가 없습니다.")).toBeInTheDocument();
    expect(screen.getByText("전체 0개 코드, 현재 활성 0개")).toBeInTheDocument();
  });
});
