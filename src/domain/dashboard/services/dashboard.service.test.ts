import { beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardService } from "@/domain/dashboard/services/dashboard.service";

describe("DashboardService", () => {
  const findUserWorkspace = vi.fn();
  const findMembers = vi.fn();
  const findActiveScoreboardsByWorkspace = vi.fn();
  const findLogsForLeadMeasures = vi.fn();

  const service = new DashboardService(
    { findUserWorkspace, findMembers },
    { findActiveScoreboardsByWorkspace },
    { findLogsForLeadMeasures },
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("워크스페이스가 없으면 404 에러를 던진다", async () => {
    findUserWorkspace.mockResolvedValue(null);

    await expect(service.getTeamDashboard(11)).rejects.toThrow("NOT_FOUND");
  });

  it("팀 대시보드 조회 시 멤버별 점수판 요약과 주간 로그를 반환한다", async () => {
    findUserWorkspace.mockResolvedValue({ id: 3, name: "러닝 크루" });
    findMembers.mockResolvedValue([
      {
        id: 100,
        workspaceId: 3,
        userId: 11,
        role: "ADMIN",
        user: { nickname: "지훈" },
      },
      {
        id: 101,
        workspaceId: 3,
        userId: 12,
        role: "MEMBER",
        user: { nickname: "민서" },
      },
    ]);
    findActiveScoreboardsByWorkspace.mockResolvedValue([
      {
        id: 21,
        userId: 11,
        goalName: "러닝 루틴 만들기",
        lagMeasure: "주 5회 달리기",
        status: "ACTIVE",
        leadMeasures: [
          {
            id: 31,
            name: "아침 러닝",
            targetValue: 5,
            status: "ACTIVE",
          },
        ],
      },
    ]);
    findLogsForLeadMeasures.mockResolvedValue([
      { leadMeasureId: 31, logDate: "2026-03-09", value: true },
      { leadMeasureId: 31, logDate: "2026-03-10", value: false },
      { leadMeasureId: 31, logDate: "2026-03-11", value: true },
    ]);

    const result = await service.getTeamDashboard(11, "2026-03-09");

    expect(result).toEqual({
      workspaceId: 3,
      workspaceName: "러닝 크루",
      weekStart: "2026-03-09",
      weekEnd: "2026-03-15",
      members: [
        {
          userId: 11,
          nickname: "지훈",
          role: "ADMIN",
          hasScoreboard: true,
          scoreboardId: 21,
          goalName: "러닝 루틴 만들기",
          lagMeasure: "주 5회 달리기",
          achieved: 2,
          total: 5,
          achievementRate: 40,
          isWinning: false,
          leadMeasures: [
            {
              id: 31,
              name: "아침 러닝",
              targetValue: 5,
              achieved: 2,
              achievementRate: 40,
              logs: {
                "2026-03-09": true,
                "2026-03-10": false,
                "2026-03-11": true,
                "2026-03-12": null,
                "2026-03-13": null,
                "2026-03-14": null,
                "2026-03-15": null,
              },
            },
          ],
        },
        {
          userId: 12,
          nickname: "민서",
          role: "MEMBER",
          hasScoreboard: false,
          scoreboardId: null,
          goalName: null,
          lagMeasure: null,
          achieved: 0,
          total: 0,
          achievementRate: 0,
          isWinning: false,
          leadMeasures: [],
        },
      ],
    });
    expect(findActiveScoreboardsByWorkspace).toHaveBeenCalledWith(3);
    expect(findLogsForLeadMeasures).toHaveBeenCalledWith(
      [31],
      "2026-03-09",
      "2026-03-15",
    );
  });
});
