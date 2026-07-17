import { fireEvent, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/render";

import { MemberListItem } from "./MemberListItem";

type MemberListItemProps = ComponentProps<typeof MemberListItem>;

function createMember(
  overrides: Partial<MemberListItemProps["member"]> = {},
): MemberListItemProps["member"] {
  return {
    avatarKey: null,
    id: 10,
    isMe: false,
    nickname: "홍길동",
    role: "MEMBER",
    ...overrides,
  };
}

function renderMemberListItem(
  overrides: Partial<MemberListItemProps["member"]> = {},
  props: Partial<Omit<MemberListItemProps, "member">> = {},
) {
  const onRemove = vi.fn();
  const onTransferAdmin = vi.fn();

  renderWithProviders(
    <MemberListItem
      index={0}
      isPendingDelete={false}
      isPendingTransfer={false}
      member={createMember(overrides)}
      onRemove={onRemove}
      onTransferAdmin={onTransferAdmin}
      totalCount={1}
      {...props}
    />,
  );

  return { onRemove, onTransferAdmin };
}

describe("MemberListItem", () => {
  it("renders member identity, role, and admin actions for a regular member", () => {
    renderMemberListItem();

    expect(screen.getByText("홍길동")).toBeInTheDocument();
    expect(screen.getByText("MEMBER")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /권한 이전/ }),
    ).toBeEnabled();
    expect(screen.getByRole("button", { name: /퇴출/ })).toBeEnabled();
  });

  it("passes member id and nickname when admin actions are clicked", () => {
    const { onRemove, onTransferAdmin } = renderMemberListItem();

    fireEvent.click(screen.getByRole("button", { name: /권한 이전/ }));
    fireEvent.click(screen.getByRole("button", { name: /퇴출/ }));

    expect(onTransferAdmin).toHaveBeenCalledWith(10, "홍길동");
    expect(onRemove).toHaveBeenCalledWith(10, "홍길동");
  });

  it("marks the current user and disables removal", () => {
    const { onRemove } = renderMemberListItem({
      isMe: true,
      role: "ADMIN",
    });

    expect(screen.getByText("ADMIN")).toBeInTheDocument();
    expect(screen.getByText("나")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /권한 이전/ }),
    ).not.toBeInTheDocument();

    const removeButton = screen.getByRole("button", { name: /퇴출/ });
    expect(removeButton).toBeDisabled();

    fireEvent.click(removeButton);

    expect(onRemove).not.toHaveBeenCalled();
  });

  it("does not show transfer action for another admin", () => {
    renderMemberListItem({
      id: 11,
      nickname: "관리자",
      role: "ADMIN",
    });

    expect(
      screen.queryByRole("button", { name: /권한 이전/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /퇴출/ })).toBeEnabled();
  });

  it("disables actions for members without a valid id", () => {
    const { onRemove } = renderMemberListItem({
      id: undefined,
      nickname: undefined,
    });

    expect(screen.getByText("사용자")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /권한 이전/ }),
    ).not.toBeInTheDocument();

    const removeButton = screen.getByRole("button", { name: /퇴출/ });
    expect(removeButton).toBeDisabled();

    fireEvent.click(removeButton);

    expect(onRemove).not.toHaveBeenCalled();
  });

  it("shows pending copy and disables both actions while transfer is pending", () => {
    renderMemberListItem({}, { isPendingTransfer: true });

    expect(screen.getByRole("button", { name: /처리 중/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /퇴출/ })).toBeDisabled();
  });

  it("shows pending copy and disables transfer while removal is pending", () => {
    renderMemberListItem({}, { isPendingDelete: true });

    expect(screen.getByRole("button", { name: /권한 이전/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /처리 중/ })).toBeDisabled();
  });
});
