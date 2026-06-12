import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useCreateWorkspaceForm } from "./useCreateWorkspaceForm";

describe("useCreateWorkspaceForm", () => {
  it("starts with the default checkout form values", () => {
    const { result } = renderHook(() => useCreateWorkspaceForm());

    expect(result.current.name).toBe("");
    expect(result.current.seatCount).toBe("1");
    expect(result.current.promotionCode).toBe("");
    expect(result.current.error).toBe("");
  });

  it("validates and trims the workspace name", () => {
    const { result } = renderHook(() => useCreateWorkspaceForm());
    let validatedName: string | null = null;

    act(() => {
      result.current.handleNameChange("  Growth Team  ");
    });
    act(() => {
      validatedName = result.current.getValidatedName();
    });

    expect(validatedName).toBe("Growth Team");
  });

  it("stores an error when the workspace name is blank and clears it on change", () => {
    const { result } = renderHook(() => useCreateWorkspaceForm());

    act(() => {
      expect(result.current.getValidatedName()).toBeNull();
    });
    expect(result.current.error).toBe("워크스페이스 이름을 입력해주세요.");

    act(() => {
      result.current.handleNameChange("Ops");
    });
    expect(result.current.error).toBe("");
  });

  it("accepts only integer seat counts between 1 and 999", () => {
    const { result } = renderHook(() => useCreateWorkspaceForm());
    let validatedSeatCount: number | null = null;

    act(() => {
      result.current.handleSeatCountChange("3");
    });
    act(() => {
      validatedSeatCount = result.current.getValidatedSeatCount();
    });
    expect(validatedSeatCount).toBe(3);

    act(() => {
      result.current.handleSeatCountChange("0");
    });
    act(() => {
      validatedSeatCount = result.current.getValidatedSeatCount();
    });
    expect(validatedSeatCount).toBeNull();
    expect(result.current.error).toBe("좌석 수는 1~999 사이의 정수여야 합니다.");

    act(() => {
      result.current.handleSeatCountChange("1.5");
    });
    act(() => {
      validatedSeatCount = result.current.getValidatedSeatCount();
    });
    expect(validatedSeatCount).toBeNull();
  });

  it("trims the promotion code without changing its case", () => {
    const { result } = renderHook(() => useCreateWorkspaceForm());

    act(() => {
      result.current.handlePromotionCodeChange("  beta-2026  ");
    });

    expect(result.current.getValidatedPromotionCode()).toBe("beta-2026");
  });
});
