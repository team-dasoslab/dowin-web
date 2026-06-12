import { fireEvent, screen, waitFor } from "@testing-library/react";
import type { ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  type DashboardTeamMemo,
  TeamDashboardMemberRole,
} from "@/api/generated/dowin.schemas";
import { renderWithProviders } from "@/test/render";

import { TeamMemberMemoPanel } from "./TeamMemberMemoPanel";

type TeamMemberMemoPanelProps = ComponentProps<typeof TeamMemberMemoPanel>;

const createMemo = vi.fn();
const resolveMemo = vi.fn();
const deleteMemo = vi.fn();
const onCloseMemo = vi.fn();

function createMember(
  overrides: Partial<TeamMemberMemoPanelProps["member"]> = {},
): TeamMemberMemoPanelProps["member"] {
  return {
    avatarKey: "avatar-blue",
    goalName: "분기 매출 1억원 만들기",
    hasScoreboard: true,
    leadMeasures: [],
    nickname: "홍길동",
    role: TeamDashboardMemberRole.MEMBER,
    userId: 1,
    ...overrides,
  };
}

function createMemoItem(overrides: Partial<DashboardTeamMemo> = {}) {
  return {
    author: {
      avatarKey: "avatar-green",
      nickname: "관리자",
      userId: 9,
    },
    content: "이번 주 고객 통화 확인",
    createdAt: "2026-06-10T00:00:00.000Z",
    id: 10,
    isResolved: false,
    resolvedAt: null,
    resolvedByUserId: null,
    targetUserId: 1,
    workspaceId: "workspace-1",
    ...overrides,
  } satisfies DashboardTeamMemo;
}

function createProps(
  overrides: Partial<TeamMemberMemoPanelProps> = {},
): TeamMemberMemoPanelProps {
  return {
    createMemo,
    currentUserId: 1,
    currentUserRole: TeamDashboardMemberRole.MEMBER,
    deleteMemo,
    isCreatePending: false,
    isDeletePending: false,
    isMemosError: false,
    isMemosLoading: false,
    isResolvePending: false,
    member: createMember(),
    memoMode: null,
    memos: [],
    onCloseMemo,
    resolveMemo,
    ...overrides,
  };
}

function renderMemoPanel(overrides: Partial<TeamMemberMemoPanelProps> = {}) {
  const props = createProps(overrides);

  return {
    props,
    ...renderWithProviders(<TeamMemberMemoPanel {...props} />),
  };
}

describe("TeamMemberMemoPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createMemo.mockResolvedValue(true);
    resolveMemo.mockResolvedValue(true);
    deleteMemo.mockResolvedValue(true);
  });

  it("creates a memo from compose mode and clears the draft on success", async () => {
    renderMemoPanel({ memoMode: "compose" });

    const input = screen.getAllByPlaceholderText("댓글 추가")[0];
    const submitButton = screen.getAllByRole("button", { name: "메모 등록" })[0];

    expect(submitButton).toBeDisabled();

    fireEvent.change(input, {
      target: { value: "  다음 회의에서 확인  " },
    });
    fireEvent.click(submitButton);

    await waitFor(() =>
      expect(createMemo).toHaveBeenCalledWith("다음 회의에서 확인"),
    );
    await waitFor(() => expect(input).toHaveValue(""));
  });

  it("keeps the memo draft when create fails", async () => {
    createMemo.mockResolvedValue(false);
    renderMemoPanel({ memoMode: "compose" });

    const input = screen.getAllByPlaceholderText("댓글 추가")[0];

    fireEvent.change(input, {
      target: { value: "실패해도 유지할 메모" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "메모 등록" })[0]);

    await waitFor(() =>
      expect(createMemo).toHaveBeenCalledWith("실패해도 유지할 메모"),
    );
    expect(input).toHaveValue("실패해도 유지할 메모");
  });

  it("renders loading and error states in view mode", () => {
    const { rerender } = renderMemoPanel({
      isMemosLoading: true,
      memoMode: "view",
    });

    expect(screen.getAllByText("메모를 불러오는 중입니다.").length).toBeGreaterThan(
      0,
    );

    rerender(
      <TeamMemberMemoPanel
        {...createProps({
          isMemosError: true,
          memoMode: "view",
        })}
      />,
    );

    expect(screen.getAllByText("메모를 불러오지 못했습니다.").length).toBeGreaterThan(
      0,
    );
  });

  it("allows an admin to resolve another member's memo without delete access", async () => {
    renderMemoPanel({
      currentUserId: 1,
      currentUserRole: TeamDashboardMemberRole.ADMIN,
      memoMode: "view",
      memos: [createMemoItem()],
    });

    expect(screen.getAllByText("이번 주 고객 통화 확인").length).toBeGreaterThan(0);
    expect(
      screen.queryByRole("button", { name: "댓글 삭제" }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "댓글 확인" })[0]);

    await waitFor(() => expect(resolveMemo).toHaveBeenCalledWith(10, true));
    expect(deleteMemo).not.toHaveBeenCalled();
  });

  it("allows the memo author to resolve and delete their memo", async () => {
    renderMemoPanel({
      currentUserId: 9,
      currentUserRole: TeamDashboardMemberRole.MEMBER,
      memoMode: "view",
      memos: [createMemoItem()],
    });

    fireEvent.click(screen.getAllByRole("button", { name: "댓글 확인" })[0]);
    fireEvent.click(screen.getAllByRole("button", { name: "댓글 삭제" })[0]);

    await waitFor(() => expect(resolveMemo).toHaveBeenCalledWith(10, true));
    await waitFor(() => expect(deleteMemo).toHaveBeenCalledWith(10));
  });

  it("does not render memo controls when closed", () => {
    renderMemoPanel({ memoMode: null, memos: [createMemoItem()] });

    expect(screen.queryByText("이번 주 고객 통화 확인")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "메모 등록" }),
    ).not.toBeInTheDocument();
  });
});
