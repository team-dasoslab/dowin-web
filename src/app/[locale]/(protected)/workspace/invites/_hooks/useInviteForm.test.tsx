import { act, renderHook } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import koMessages from "@/messages/ko.json";

import { useInviteForm } from "./useInviteForm";

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

describe("useInviteForm", () => {
  it("starts with a default max uses value and no error", () => {
    const { result } = renderHook(() => useInviteForm(), { wrapper });

    expect(result.current.maxUsesInput).toBe("3");
    expect(result.current.formError).toBe("");
  });

  it("validates the current max uses input", () => {
    const { result } = renderHook(() => useInviteForm(), { wrapper });
    let maxUses: number | null = null;

    act(() => {
      result.current.handleMaxUsesInputChange("10");
    });
    act(() => {
      maxUses = result.current.getValidatedMaxUses();
    });

    expect(maxUses).toBe(10);
    expect(result.current.formError).toBe("");
  });

  it("selects preset values", () => {
    const { result } = renderHook(() => useInviteForm(), { wrapper });

    act(() => {
      result.current.selectPresetMaxUses(5);
    });

    expect(result.current.maxUsesInput).toBe("5");
  });

  it("stores an error for invalid max uses and clears it on change", () => {
    const { result } = renderHook(() => useInviteForm(), { wrapper });
    let maxUses: number | null = null;

    act(() => {
      result.current.handleMaxUsesInputChange("0");
    });
    act(() => {
      maxUses = result.current.getValidatedMaxUses();
    });

    expect(maxUses).toBeNull();
    expect(result.current.formError).toBe("사용 횟수는 1 이상이어야 합니다.");

    act(() => {
      result.current.handleMaxUsesInputChange("1");
    });

    expect(result.current.formError).toBe("");
  });

  it("rejects non-integer and over-limit values", () => {
    const { result } = renderHook(() => useInviteForm(), { wrapper });
    let maxUses: number | null = null;

    act(() => {
      result.current.handleMaxUsesInputChange("1.5");
    });
    act(() => {
      maxUses = result.current.getValidatedMaxUses();
    });
    expect(maxUses).toBeNull();
    expect(result.current.formError).toBe("사용 횟수는 정수여야 합니다.");

    act(() => {
      result.current.handleMaxUsesInputChange("1000");
    });
    act(() => {
      maxUses = result.current.getValidatedMaxUses();
    });
    expect(maxUses).toBeNull();
    expect(result.current.formError).toBe("사용 횟수는 999 이하여야 합니다.");
  });
});
