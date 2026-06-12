import type { FormEvent } from "react";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useJoinWorkspaceForm } from "./useJoinWorkspaceForm";

const createSubmitEvent = () =>
  ({
    preventDefault: vi.fn(),
  }) as unknown as FormEvent<HTMLFormElement>;

describe("useJoinWorkspaceForm", () => {
  it("submits a trimmed uppercase invite code", () => {
    const onSubmitCode = vi.fn();
    const { result } = renderHook(() =>
      useJoinWorkspaceForm({ onSubmitCode }),
    );

    act(() => {
      result.current.handleInviteCodeChange("  abcd12  ");
    });

    const event = createSubmitEvent();
    act(() => {
      result.current.handleSubmit(event);
    });

    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(onSubmitCode).toHaveBeenCalledWith("ABCD12");
    expect(result.current.error).toBe("");
  });

  it("rejects short invite codes and does not submit", () => {
    const onSubmitCode = vi.fn();
    const { result } = renderHook(() =>
      useJoinWorkspaceForm({ onSubmitCode }),
    );

    act(() => {
      result.current.handleInviteCodeChange("abc");
    });

    act(() => {
      result.current.handleSubmit(createSubmitEvent());
    });

    expect(onSubmitCode).not.toHaveBeenCalled();
    expect(result.current.error).toBe("초대코드를 입력해주세요.");
  });

  it("clears a previous error when the invite code changes", () => {
    const { result } = renderHook(() =>
      useJoinWorkspaceForm({ onSubmitCode: vi.fn() }),
    );

    act(() => {
      result.current.handleSubmit(createSubmitEvent());
    });
    expect(result.current.error).toBe("초대코드를 입력해주세요.");

    act(() => {
      result.current.handleInviteCodeChange("abcdef");
    });
    expect(result.current.error).toBe("");
  });
});
