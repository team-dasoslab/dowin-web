import { act, renderHook } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import koMessages from "@/messages/ko.json";

import { useDeleteAccountForm } from "./useDeleteAccountForm";

function wrapper({ children }: { children: ReactNode }) {
  return (
    <NextIntlClientProvider
      locale="ko"
      messages={koMessages}
      timeZone="Asia/Seoul"
    >
      {children}
    </NextIntlClientProvider>
  );
}

describe("useDeleteAccountForm", () => {
  it("starts with empty form values", () => {
    const { result } = renderHook(() => useDeleteAccountForm(), { wrapper });

    expect(result.current.currentPassword).toBe("");
    expect(result.current.confirmationText).toBe("");
  });

  it("requires the current password", () => {
    const { result } = renderHook(() => useDeleteAccountForm(), { wrapper });

    expect(result.current.validate()).toBe("현재 비밀번호를 입력해주세요.");
  });

  it("requires the exact confirmation text", () => {
    const { result } = renderHook(() => useDeleteAccountForm(), { wrapper });

    act(() => {
      result.current.setCurrentPassword("password123");
      result.current.setConfirmationText("탈퇴");
    });

    expect(result.current.validate()).toBe("확인 문구를 정확히 입력해주세요.");
  });

  it("passes validation with a password and exact confirmation text", () => {
    const { result } = renderHook(() => useDeleteAccountForm(), { wrapper });

    act(() => {
      result.current.setCurrentPassword("password123");
      result.current.setConfirmationText("탈퇴합니다");
    });

    expect(result.current.validate()).toBeNull();
  });
});
