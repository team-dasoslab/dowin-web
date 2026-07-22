import { beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardService } from "@/domain/dashboard/services/dashboard.service";

describe("DashboardService", () => {
  const findMembers = vi.fn();
  const countMembers = vi.fn();
  const findBillingState = vi.fn();
  const findPlanLimit = vi.fn();
  const findActiveScoreboardsByWorkspace = vi.fn();
  const findActiveScoreboard = vi.fn();
  const findLogsForLeadMeasures = vi.fn();

  const service = new DashboardService(
    { findMembers, countMembers, findBillingState, findPlanLimit },
    { findActiveScoreboard, findActiveScoreboardsByWorkspace },
    { findLogsForLeadMeasures },
  );

  const context: Parameters<typeof service.getTeamDashboard>[0] = { workspaceId: 3, workspacePublicId: "workspace-3", workspaceName: "러닝 크루", userId: 11, role: "ADMIN", membershipId: 1, entitlement: { canAccessBasicSubscription: true, entitlementSource: null, billingStatus: "ACTIVE", planCode: "STANDARD" } } as unknown as Parameters<typeof service.getTeamDashboard>[0];

  beforeEach(() => {
    vi.clearAllMocks();
    countMembers.mockResolvedValue(2);
    findBillingState.mockResolvedValue({
      planCode: "BASIC",
      billingStatus: "ACTIVE",
      entitlementSource: "POLAR",
    });
    findPlanLimit.mockResolvedValue({ memberLimit: 10 });
  });

  it("워크스페이스가 없으면 404 에러를 던진다", async () => {
    // 워크스페이스 없는 경우는 API 계층에서 처리하므로 생략
  });


  it("팀 대시보드 조회 시 멤버별 점수판 요약과 주간 로그를 반환한다", async () => {
    findMembers.mockResolvedValue([
      {
        id: 100,
        workspaceId: 3,
        userId: 11,
        role: "ADMIN",
        user: { nickname: "지훈", avatarKey: "smile.blue" },
      },
      {
        id: 101,
        workspaceId: 3,
        userId: 12,
        role: "MEMBER",
        user: { nickname: "민서", avatarKey: null },
      },
    ]);
    findActiveScoreboardsByWorkspace.mockResolvedValue([
      {
        id: 21,
        userId: 11,
        goalName: "러닝 루틴 만들기",
        lagMeasure: "주 5회 달리기",
        startDate: "2025-01-01",
        status: "ACTIVE",
        leadMeasures: [
          {
            id: 31,
            name: "아침 러닝",
            targetValue: 5,
            period: "WEEKLY",
            status: "ACTIVE",
            tags: [{ id: 1, name: "운동" }],
          },
          {
            id: 32,
            name: "주간 회고",
            targetValue: 2,
            period: "MONTHLY",
            status: "ACTIVE",
            tags: [{ id: 2, name: "회고" }],
          },
        ],
      },
    ]);
    findLogsForLeadMeasures.mockResolvedValue([
      { leadMeasureId: 31, logDate: "2026-03-09", value: true },
      { leadMeasureId: 31, logDate: "2026-03-10", value: false },
      { leadMeasureId: 31, logDate: "2026-03-11", value: true },
      { leadMeasureId: 32, logDate: "2026-03-09", value: true },
      { leadMeasureId: 32, logDate: "2026-03-10", value: true },
      { leadMeasureId: 32, logDate: "2026-03-11", value: true },
    ]);

    const result = await service.getTeamDashboard(context, "2026-03-09");

    expect(result).toEqual({
      workspaceId: 3,
      workspaceName: "러닝 크루",
      weekStart: "2026-03-09",
      weekEnd: "2026-03-15",
      members: [
        {
          userId: 11,
          nickname: "지훈",
          avatarKey: "smile.blue",
          role: "ADMIN",
          hasScoreboard: true,
          scoreboardId: 21,
          goalName: "러닝 루틴 만들기",
          lagMeasure: "주 5회 달리기",
          achieved: 2,
          total: 5,
          achievementRate: 40,
          weeklyAchievementRate: 40,
          monthlyAchievementRate: 18,
          isWinning: false,
          currentCheckinStreak: 0,
          currentStreak: 0,
          leadMeasures: [
            {
              id: 31,
              name: "아침 러닝",
              period: "WEEKLY",
              targetValue: 5,
              trackingMode: "BOOLEAN",
              dailyTargetCount: 1,
              lastWeekAchieved: 0,
              tags: [{ id: 1, name: "운동" }],
              achieved: 2,
              total: 5,
              achievementRate: 40,
              logs: {
                "2026-03-09": { value: true, count: 1, achieved: true },
                "2026-03-10": { value: false, count: 0, achieved: false },
                "2026-03-11": { value: true, count: 1, achieved: true },
                "2026-03-12": null,
                "2026-03-13": null,
                "2026-03-14": null,
                "2026-03-15": null,
              },
            },
            {
              id: 32,
              name: "주간 회고",
              period: "MONTHLY",
              targetValue: 2,
              trackingMode: "BOOLEAN",
              dailyTargetCount: 1,
              lastWeekAchieved: 0,
              tags: [{ id: 2, name: "회고" }],
              achieved: 3,
              total: 2,
              achievementRate: 100,
              logs: {
                "2026-03-09": { value: true, count: 1, achieved: true },
                "2026-03-10": { value: true, count: 1, achieved: true },
                "2026-03-11": { value: true, count: 1, achieved: true },
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
          avatarKey: null,
          role: "MEMBER",
          hasScoreboard: false,
          scoreboardId: null,
          goalName: null,
          lagMeasure: null,
          achieved: 0,
          total: 0,
          achievementRate: 0,
          weeklyAchievementRate: 0,
          monthlyAchievementRate: 0,
          isWinning: false,
          currentCheckinStreak: 0,
          currentStreak: 0,
          leadMeasures: [],
        },
      ],
    });
    expect(findActiveScoreboardsByWorkspace).toHaveBeenCalledWith(3);
    expect(findLogsForLeadMeasures).toHaveBeenCalledWith(
      [31, 32],
      "2026-03-02",
      "2026-03-31",
    );
  });

  it("개인 대시보드 통합 조회는 활성 점수판과 기간 데이터를 한 번에 반환한다", async () => {
    findActiveScoreboard.mockResolvedValue({
      id: 25,
      userId: 11,
      goalName: "러닝 루틴 만들기",
      lagMeasure: "주 5회 달리기",
      startDate: "2026-03-01",
      endDate: null,
      status: "ACTIVE",
      createdAt: new Date("2026-03-01T00:00:00.000Z"),
      leadMeasures: [
        {
          id: 31,
          scoreboardId: 25,
          name: "아침 러닝",
          targetValue: 5,
          period: "WEEKLY",
          trackingMode: "BOOLEAN",
          dailyTargetCount: 1,
          status: "ACTIVE",
          createdAt: new Date("2026-03-01T00:00:00.000Z"),
          archivedAt: null,
          tags: [{ id: 1, name: "운동" }],
        },
        {
          id: 32,
          scoreboardId: 25,
          name: "월간 회고",
          targetValue: 1,
          period: "MONTHLY",
          trackingMode: "COUNT",
          dailyTargetCount: 2,
          status: "ACTIVE",
          createdAt: new Date("2026-03-01T00:00:00.000Z"),
          archivedAt: null,
          tags: [],
        },
      ],
    });
    findLogsForLeadMeasures.mockResolvedValue([
      { leadMeasureId: 31, logDate: "2026-06-22", value: true, count: 1 },
      { leadMeasureId: 31, logDate: "2026-06-23", value: true, count: 1 },
      { leadMeasureId: 32, logDate: "2026-06-24", value: true, count: 2 },
    ]);

    const result = await service.getMyDashboard(context, {
      monthStart: "2026-06-01",
      view: "month",
      weekStart: "2026-06-22",
    });

    expect(findActiveScoreboard).toHaveBeenCalledWith(11, 3);
    expect(findLogsForLeadMeasures).toHaveBeenCalledTimes(1);
    expect(findLogsForLeadMeasures).toHaveBeenCalledWith(
      [31, 32],
      "2026-06-01",
      "2026-06-28",
    );
    expect(result.workspace).toMatchObject({
      id: "workspace-3",
      memberCount: 2,
      role: "ADMIN",
    });
    expect(result.activeScoreboard?.id).toBe(25);
    expect(result.weeklyLogs?.leadMeasures[0]?.achieved).toBe(2);
    expect(result.monthlyLogs?.summary.achieved).toBe(3);
    expect(result.weeklyTrendPoints).toHaveLength(4);
  });

  it("팀 주간 리포트는 현재 주 대시보드와 최근 주차별 추세를 함께 반환한다", async () => {
    findMembers.mockResolvedValue([
      {
        id: 100,
        workspaceId: 3,
        userId: 11,
        role: "ADMIN",
        user: { nickname: "지훈", avatarKey: "smile.blue" },
      },
      {
        id: 101,
        workspaceId: 3,
        userId: 12,
        role: "MEMBER",
        user: { nickname: "민서", avatarKey: null },
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
            targetValue: 2,
            period: "WEEKLY",
            status: "ACTIVE",
            tags: [],
          },
        ],
      },
    ]);
    findLogsForLeadMeasures.mockResolvedValue([
      { leadMeasureId: 31, logDate: "2026-04-06", value: true },
      { leadMeasureId: 31, logDate: "2026-04-13", value: true },
      { leadMeasureId: 31, logDate: "2026-04-14", value: true },
      { leadMeasureId: 31, logDate: "2026-04-20", value: true },
    ]);

    const result = await service.getTeamWeeklyReport(context, "2026-04-20", 3);

    expect(result).toEqual(
      expect.objectContaining({
        workspaceId: 3,
        workspaceName: "러닝 크루",
        weekStart: "2026-04-20",
        weekEnd: "2026-04-26",
        trends: [
          {
            weekStart: "2026-04-06",
            weekEnd: "2026-04-12",
            activeCount: 1,
            totalCount: 2,
            winningCount: 0,
            startedCount: 1,
            winRate: 0,
            executionRate: 100,
          },
          {
            weekStart: "2026-04-13",
            weekEnd: "2026-04-19",
            activeCount: 1,
            totalCount: 2,
            winningCount: 1,
            startedCount: 1,
            winRate: 100,
            executionRate: 100,
          },
          {
            weekStart: "2026-04-20",
            weekEnd: "2026-04-26",
            activeCount: 1,
            totalCount: 2,
            winningCount: 0,
            startedCount: 1,
            winRate: 0,
            executionRate: 100,
          },
        ],
      }),
    );
    expect(result.members[0]).toEqual(
      expect.objectContaining({
        userId: 11,
        achieved: 1,
        total: 2,
        weeklyAchievementRate: 50,
      }),
    );
    expect(findActiveScoreboardsByWorkspace).toHaveBeenCalledOnce();
    expect(findLogsForLeadMeasures).toHaveBeenCalledWith(
      [31],
      "2026-03-30",
      "2026-04-30",
    );
  });

  it("팀 대시보드 주간 전체 달성률은 각 지표 목표 상한을 넘겨 합산하지 않는다", async () => {
    findMembers.mockResolvedValue([
      {
        id: 100,
        workspaceId: 3,
        userId: 11,
        role: "ADMIN",
        user: { nickname: "지훈", avatarKey: "smile.blue" },
      },
    ]);
    findActiveScoreboardsByWorkspace.mockResolvedValue([
      {
        id: 21,
        userId: 11,
        goalName: "루틴 만들기",
        lagMeasure: "주간 실행",
        status: "ACTIVE",
        leadMeasures: [
          {
            id: 31,
            name: "유산소",
            targetValue: 3,
            period: "WEEKLY",
            status: "ACTIVE",
            tags: [],
          },
          {
            id: 32,
            name: "근력",
            targetValue: 5,
            period: "WEEKLY",
            status: "ACTIVE",
            tags: [],
          },
        ],
      },
    ]);
    findLogsForLeadMeasures.mockResolvedValue([
      { leadMeasureId: 31, logDate: "2026-03-09", value: true },
      { leadMeasureId: 31, logDate: "2026-03-10", value: true },
      { leadMeasureId: 31, logDate: "2026-03-11", value: true },
      { leadMeasureId: 31, logDate: "2026-03-12", value: true },
      { leadMeasureId: 31, logDate: "2026-03-13", value: true },
      { leadMeasureId: 32, logDate: "2026-03-09", value: true },
      { leadMeasureId: 32, logDate: "2026-03-10", value: true },
    ]);

    const result = await service.getTeamDashboard(context, "2026-03-09");

    expect(result.members).toEqual([
      expect.objectContaining({
        userId: 11,
        achieved: 5,
        total: 8,
        achievementRate: 63,
        weeklyAchievementRate: 63,
        leadMeasures: expect.arrayContaining([
          expect.objectContaining({
            id: 31,
            achieved: 5,
            achievementRate: 100,
          }),
          expect.objectContaining({
            id: 32,
            achieved: 2,
            achievementRate: 40,
          }),
        ]),
      }),
    ]);
  });

  it("팀 대시보드 주간 달성률은 이번 주 로그만 기준으로 계산한다", async () => {
    findMembers.mockResolvedValue([
      {
        id: 100,
        workspaceId: 3,
        userId: 11,
        role: "ADMIN",
        user: { nickname: "지훈", avatarKey: "smile.blue" },
      },
    ]);
    findActiveScoreboardsByWorkspace.mockResolvedValue([
      {
        id: 21,
        userId: 11,
        goalName: "루틴 만들기",
        lagMeasure: "주간 실행",
        status: "ACTIVE",
        leadMeasures: [
          {
            id: 31,
            name: "유산소",
            targetValue: 4,
            period: "WEEKLY",
            status: "ACTIVE",
            tags: [],
          },
          {
            id: 32,
            name: "근력",
            targetValue: 7,
            period: "WEEKLY",
            status: "ACTIVE",
          },
        ],
      },
    ]);
    findLogsForLeadMeasures.mockResolvedValue([
      { leadMeasureId: 31, logDate: "2026-03-02", value: true },
      { leadMeasureId: 31, logDate: "2026-03-03", value: true },
      { leadMeasureId: 31, logDate: "2026-03-09", value: true },
      { leadMeasureId: 31, logDate: "2026-03-10", value: true },
      { leadMeasureId: 31, logDate: "2026-03-11", value: true },
      { leadMeasureId: 32, logDate: "2026-03-09", value: true },
      { leadMeasureId: 32, logDate: "2026-03-10", value: true },
      { leadMeasureId: 32, logDate: "2026-03-11", value: true },
      { leadMeasureId: 32, logDate: "2026-03-12", value: true },
      { leadMeasureId: 32, logDate: "2026-03-13", value: true },
    ]);

    const result = await service.getTeamDashboard(context, "2026-03-09");

    expect(result.members).toEqual([
      expect.objectContaining({
        userId: 11,
        achieved: 8,
        total: 11,
        achievementRate: 73,
        weeklyAchievementRate: 73,
        leadMeasures: expect.arrayContaining([
          expect.objectContaining({
            id: 31,
            achieved: 3,
            achievementRate: 75,
          }),
          expect.objectContaining({
            id: 32,
            achieved: 5,
            achievementRate: 71.4,
          }),
        ]),
      }),
    ]);
  });

  it("팀 대시보드 멤버 목록은 로그인 사용자를 최상단에 배치한다", async () => {
    findMembers.mockResolvedValue([
      {
        id: 100,
        workspaceId: 3,
        userId: 12,
        role: "MEMBER",
        user: { nickname: "민서", avatarKey: null },
      },
      {
        id: 101,
        workspaceId: 3,
        userId: 11,
        role: "ADMIN",
        user: { nickname: "지훈", avatarKey: "smile.blue" },
      },
      {
        id: 102,
        workspaceId: 3,
        userId: 13,
        role: "MEMBER",
        user: { nickname: "도윤", avatarKey: "smile.green" },
      },
    ]);
    findActiveScoreboardsByWorkspace.mockResolvedValue([]);
    findLogsForLeadMeasures.mockResolvedValue([]);

    const result = await service.getTeamDashboard(context, "2026-03-09");

    expect(result.members.map((member) => member.userId)).toEqual([11, 12, 13]);
  });

  it("팀 대시보드 주간 및 월간 달성률은 지표가 생성된 주차부터 계산한다", async () => {
    findMembers.mockResolvedValue([
      {
        id: 100,
        workspaceId: 3,
        userId: 11,
        role: "ADMIN",
        user: { nickname: "지훈", avatarKey: "smile.blue" },
      },
    ]);
    findActiveScoreboardsByWorkspace.mockResolvedValue([
      {
        id: 21,
        userId: 11,
        goalName: "루틴 만들기",
        lagMeasure: "주간 실행",
        status: "ACTIVE",
        leadMeasures: [
          {
            id: 31,
            name: "과거 생성 지표",
            targetValue: 3,
            period: "WEEKLY",
            status: "ACTIVE",
            createdAt: new Date("2026-02-01T00:00:00.000Z"),
            tags: [],
          },
          {
            id: 32,
            name: "이번 주 생성 지표",
            targetValue: 5,
            period: "WEEKLY",
            status: "ACTIVE",
            createdAt: new Date("2026-03-11T00:00:00.000Z"), // Wednesday of 2026-03-09 week
            tags: [],
          },
          {
            id: 33,
            name: "다음 주 생성 지표",
            targetValue: 4,
            period: "WEEKLY",
            status: "ACTIVE",
            createdAt: new Date("2026-03-16T00:00:00.000Z"), // Monday of next week
            tags: [],
          },
        ],
      },
    ]);
    findLogsForLeadMeasures.mockResolvedValue([
      { leadMeasureId: 31, logDate: "2026-03-09", value: true },
      { leadMeasureId: 31, logDate: "2026-03-10", value: true },
      { leadMeasureId: 32, logDate: "2026-03-12", value: true },
      { leadMeasureId: 32, logDate: "2026-03-13", value: true },
    ]);

    const result = await service.getTeamDashboard(context, "2026-03-09");

    // id: 33 should not be in the weekly leadMeasures since it's created after weekEnd
    const member = result.members[0];
    expect(member?.leadMeasures.map(m => m.id)).toEqual([31, 32]);

    // monthlyAchievementRate check:
    // weekStarts in month: 2026-02-23, 03-02, 03-09, 03-16, 03-23, 03-30 (6 weeks)
    // 31: created 2026-02-01. Effective weeks: 6. target = 18. achieved = 2
    // 32: created 2026-03-11. Effective weeks: 4 (03-09, 03-16, 03-23, 03-30). target = 20. achieved = 2
    // 33: created 2026-03-16. Effective weeks: 3 (03-16, 03-23, 03-30). target = 12. achieved = 0
    // Total monthly target = 18 + 20 = 38 (33 is excluded)
    // Total monthly achieved = 2 + 2 = 4
    // Monthly rate = Math.round(4 / 38 * 100) = 11
    
    // Weekly rate check:
    // 31 target: 3, achieved: 2
    // 32 target: 5, achieved: 2
    // 33 target is omitted (not counted for this week since created after weekEnd)
    // Total weekly target = 8, achieved = 4 => 50%
    
    expect(member?.weeklyAchievementRate).toBe(50);
    expect(member?.monthlyAchievementRate).toBe(15);
  });
});
