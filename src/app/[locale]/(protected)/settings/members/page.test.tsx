import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useGetUsersMe } from "@/api/generated/profile/profile";
import {
  useGetWorkspacesIdMembers,
  useGetWorkspacesMe,
} from "@/api/generated/workspace/workspace";
import { renderWithProviders } from "@/test/render";

import ProfileMembersPage from "./page";
import { useRemoveWorkspaceMember } from "./_hooks/useRemoveWorkspaceMember";
import { useTransferWorkspaceAdmin } from "./_hooks/useTransferWorkspaceAdmin";

vi.mock("@/api/generated/profile/profile", () => ({
  useGetUsersMe: vi.fn(),
}));

vi.mock("@/api/generated/workspace/workspace", () => ({
  useGetWorkspacesIdMembers: vi.fn(),
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

vi.mock("./_hooks/useRemoveWorkspaceMember", () => ({
  useRemoveWorkspaceMember: vi.fn(),
}));

vi.mock("./_hooks/useTransferWorkspaceAdmin", () => ({
  useTransferWorkspaceAdmin: vi.fn(),
}));

const removeMember = vi.fn();
const transferAdmin = vi.fn();

function mockProfile(
  overrides: Partial<{
    data: ReturnType<typeof useGetUsersMe>["data"];
    isLoading: boolean;
  }> = {},
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

function mockMembers(
  overrides: Partial<ReturnType<typeof useGetWorkspacesIdMembers>> = {},
) {
  vi.mocked(useGetWorkspacesIdMembers).mockReturnValue({
    data: {
      data: [
        {
          id: 12,
          isMe: false,
          nickname: "정회원",
          role: "MEMBER",
        },
        {
          id: 11,
          isMe: true,
          nickname: "관리자",
          role: "ADMIN",
        },
        {
          id: 13,
          isMe: false,
          nickname: "김회원",
          role: "MEMBER",
        },
      ],
      status: 200,
    },
    isLoading: false,
    ...overrides,
  } as ReturnType<typeof useGetWorkspacesIdMembers>);
}

function mockMemberMutations(
  overrides: Partial<
    ReturnType<typeof useRemoveWorkspaceMember> &
      ReturnType<typeof useTransferWorkspaceAdmin>
  > = {},
) {
  vi.mocked(useRemoveWorkspaceMember).mockReturnValue({
    pendingDeleteMemberId: null,
    removeMember,
    ...overrides,
  } as ReturnType<typeof useRemoveWorkspaceMember>);
  vi.mocked(useTransferWorkspaceAdmin).mockReturnValue({
    pendingTransferMemberId: null,
    transferAdmin,
    ...overrides,
  } as ReturnType<typeof useTransferWorkspaceAdmin>);
}

describe("ProfileMembersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProfile();
    mockWorkspace();
    mockMembers();
    mockMemberMutations();
  });

  it("renders loading skeleton while profile, workspace, or members are loading", () => {
    mockWorkspace({
      isLoading: true,
    } as Partial<ReturnType<typeof useGetWorkspacesMe>>);

    const { container } = renderWithProviders(<ProfileMembersPage />);

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

    renderWithProviders(<ProfileMembersPage />);

    expect(screen.getByText("워크스페이스가 없어요")).toBeInTheDocument();
    expect(
      screen.getByText("멤버 관리는 워크스페이스를 만든 뒤 사용할 수 있습니다."),
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

  it("blocks non-admin users from member management", () => {
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

    renderWithProviders(<ProfileMembersPage />);

    expect(screen.getByText("관리자만 접근할 수 있어요")).toBeInTheDocument();
    expect(
      screen.getByText(
        "멤버 퇴출과 초대코드 관리는 현재 워크스페이스의 관리자만 할 수 있습니다.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "설정으로 돌아가기" })).toHaveAttribute(
      "href",
      "/workspace-1/profile",
    );
    expect(useGetWorkspacesIdMembers).toHaveBeenCalledWith(
      "workspace-1",
      expect.objectContaining({
        query: expect.objectContaining({
          enabled: false,
        }),
      }),
    );
  });

  it("renders workspace summary, invite link, sorted members, and member limit", () => {
    renderWithProviders(<ProfileMembersPage />);

    expect(screen.getByRole("heading", { name: "멤버 관리" })).toBeInTheDocument();
    expect(screen.getByText("Dowin Team")).toBeInTheDocument();
    expect(
      screen.getByText("현재 3명의 멤버가 함께하고 있습니다."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "초대코드 관리" })).toHaveAttribute(
      "href",
      "/workspace-1/settings/invites",
    );
    expect(screen.getByText("현재 멤버")).toBeInTheDocument();
    expect(screen.getByText(/\/\s*10/)).toBeInTheDocument();

    const memberNames = screen.getAllByText(/관리자|김회원|정회원/);
    expect(memberNames.map((node) => node.textContent)).toEqual([
      "관리자",
      "김회원",
      "정회원",
    ]);
  });

  it("passes member actions through to mutation hooks", () => {
    renderWithProviders(<ProfileMembersPage />);

    fireEvent.click(screen.getAllByRole("button", { name: /권한 이전/ })[0]);
    fireEvent.click(screen.getAllByRole("button", { name: /퇴출/ })[1]);

    expect(transferAdmin).toHaveBeenCalledWith(13, "김회원");
    expect(removeMember).toHaveBeenCalledWith(13, "김회원");
  });

  it("disables the matching row while a member action is pending", () => {
    mockMemberMutations({
      pendingDeleteMemberId: 13,
      pendingTransferMemberId: null,
    });

    renderWithProviders(<ProfileMembersPage />);

    expect(screen.getByRole("button", { name: /처리 중/ })).toBeDisabled();
    expect(screen.getAllByRole("button", { name: /권한 이전/ })[0]).toBeDisabled();
  });

  it("renders empty members state", () => {
    mockMembers({
      data: {
        data: [],
        status: 200,
      },
    } as Partial<ReturnType<typeof useGetWorkspacesIdMembers>>);

    renderWithProviders(<ProfileMembersPage />);

    expect(screen.getByText("아직 등록된 멤버가 없습니다.")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
  });
});
