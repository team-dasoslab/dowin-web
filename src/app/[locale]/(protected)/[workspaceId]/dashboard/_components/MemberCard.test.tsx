
vi.mock("@/app/[locale]/(protected)/[workspaceId]/dashboard/_hooks/useNudgeMember", () => ({
  useNudgeMember: () => ({
    nudgeMember: vi.fn(),
    isNudging: false,
  }),
}));

import { screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/render";

import { MemberCard } from "./MemberCard";

type MemberCardProps = ComponentProps<typeof MemberCard>;

function createMember(
  overrides: Partial<MemberCardProps["member"]> = {},
): MemberCardProps["member"] {
  return {
    achievementRate: 40,
    avatarKey: "avatar-blue",
    goalName: "분기 매출 1억원 만들기",
    hasScoreboard: true,
    lagMeasure: "월 매출 3천만원에서 1억원으로",
    monthlyAchievementRate: 65,
    nickname: "홍길동",
    role: "MEMBER",
    userId: 1,
    weeklyAchievementRate: 80,
    ...overrides,
  };
}

function renderMemberCard(
  overrides: Partial<MemberCardProps["member"]> = {},
  props: Omit<Partial<MemberCardProps>, "member"> = {},
) {
  return renderWithProviders(
    <MemberCard member={createMember(overrides)} {...props} />,
  );
}

describe("MemberCard", () => {
  it("renders member identity, goal, success criteria, and achievement rates", () => {
    renderMemberCard();

    expect(screen.getByText("홍길동")).toBeInTheDocument();
    expect(screen.getByText("분기 매출 1억원 만들기")).toBeInTheDocument();
    expect(screen.getByText("월 매출 3천만원에서 1억원으로")).toBeInTheDocument();
    expect(screen.getByText("주간 달성률")).toBeInTheDocument();
    expect(screen.getByText("월간 달성률")).toBeInTheDocument();
    expect(screen.getByText("80%")).toBeInTheDocument();
    expect(screen.getByText("65%")).toBeInTheDocument();
  });

  it("marks the current user's card", () => {
    renderMemberCard({}, { isMe: true });

    expect(screen.getByText("나")).toBeInTheDocument();
  });

  it("falls back to legacy achievement rate when weekly rate is missing", () => {
    renderMemberCard({
      achievementRate: 55,
      weeklyAchievementRate: undefined,
    });

    expect(screen.getByText("55%")).toBeInTheDocument();
  });

  it("renders unset copy when the member has no scoreboard", () => {
    renderMemberCard({
      goalName: null,
      hasScoreboard: false,
      lagMeasure: null,
      monthlyAchievementRate: 0,
      weeklyAchievementRate: 0,
    });

    expect(
      screen.getByText("아직 활성화된 점수판이 없습니다"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "팀 대시보드에서 지표를 확인하려면 먼저 점수판을 생성해야 합니다. 생성된 데이터는 팀원들과 실시간으로 공유됩니다.",
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByText("미설정")).toHaveLength(2);
  });
});
