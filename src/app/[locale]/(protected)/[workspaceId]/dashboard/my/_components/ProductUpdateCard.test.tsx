import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { productUpdates } from "@/content/product-updates";
import { renderWithProviders } from "@/test/render";

import { ProductUpdateCard } from "./ProductUpdateCard";

vi.mock("next/navigation", () => ({
  useParams: vi.fn(() => ({ workspaceId: "workspace-1" })),
}));

vi.mock("@/content/product-updates", () => ({
  productUpdates: [
    {
      id: "2026-04-14-personal-reminder-schedule",
      slug: "personal-reminder",
      title: "개인 기록 리마인드 시간을 직접 정할 수 있어요",
      summary: "프로필 알림 설정에서 내 생활 리듬에 맞는 시간으로 매일 기록 리마인드 푸시를 받을 수 있습니다.",
      publishedAt: "2026.04.14",
      tag: "Profile",
      isMajor: true,
    }
  ]
}));

describe("ProductUpdateCard", () => {
  it("renders translated update content and workspace-aware links", () => {
    renderWithProviders(
      <ProductUpdateCard
        onDismiss={vi.fn()}
        update={productUpdates[0]}
      />,
    );

    expect(
      screen.getByText("개인 기록 리마인드 시간을 직접 정할 수 있어요"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "프로필 알림 설정에서 내 생활 리듬에 맞는 시간으로 매일 기록 리마인드 푸시를 받을 수 있습니다.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("새로운 기능 안내")).toBeInTheDocument();
    expect(screen.getByText("프로필")).toBeInTheDocument();
    expect(screen.getByText("2026.04.14")).toBeInTheDocument();


  });

  it("calls onDismiss when the dismiss button is clicked", () => {
    const onDismiss = vi.fn();

    renderWithProviders(
      <ProductUpdateCard
        onDismiss={onDismiss}
        update={productUpdates[0]}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "이 업데이트 잠시 숨기기" }),
    );

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
