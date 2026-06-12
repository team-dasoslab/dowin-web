import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { usePasswordChangeForm } from "./usePasswordChangeForm";

describe("usePasswordChangeForm", () => {
  it("requires the current password", () => {
    const { result } = renderHook(() => usePasswordChangeForm());

    expect(result.current.validate()).toBe("현재 비밀번호를 입력해주세요.");
  });

  it("requires a valid new password", () => {
    const { result } = renderHook(() => usePasswordChangeForm());

    act(() => {
      result.current.setCurrentPassword("old-password");
      result.current.setNewPassword("short");
    });

    expect(result.current.validate()).toBe(
      "비밀번호는 8자 이상의 영문, 숫자, 허용된 특수문자 조합이어야 합니다.",
    );
  });

  it("requires the confirmation password to match", () => {
    const { result } = renderHook(() => usePasswordChangeForm());

    act(() => {
      result.current.setCurrentPassword("old-password");
      result.current.setNewPassword("new-password");
      result.current.setConfirmPassword("different-password");
    });

    expect(result.current.validate()).toBe(
      "새 비밀번호와 비밀번호 확인이 일치하지 않습니다.",
    );
  });

  it("rejects using the same password and accepts a different valid password", () => {
    const { result } = renderHook(() => usePasswordChangeForm());

    act(() => {
      result.current.setCurrentPassword("same-password");
      result.current.setNewPassword("same-password");
      result.current.setConfirmPassword("same-password");
    });
    expect(result.current.validate()).toBe(
      "현재 비밀번호와 다른 새 비밀번호를 입력해주세요.",
    );

    act(() => {
      result.current.setNewPassword("new-password");
      result.current.setConfirmPassword("new-password");
    });
    expect(result.current.validate()).toBeNull();
  });
});
