import { AnalyticsService } from "@/domain/analytics/services/analytics.service";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("AnalyticsService", () => {
    const findActiveScoreboard = vi.fn();
  const findLogsForLeadMeasures = vi.fn();

  const service = new AnalyticsService(
    {},
    { findActiveScoreboard },
    { findLogsForLeadMeasures },
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 워크스페이스 없는 경우는 API 라우트/context 계층에서 처리하므로 이 테스트는 삭제함

  it("활성 점수판이 없으면 404 에러를 던진다", async () => {
    findActiveScoreboard.mockResolvedValue(undefined);

    await expect(
      service.getExportData({ workspaceId: 3, workspaceName: "WS", userId: 11, role: "ADMIN", membershipId: 1, entitlement: { canAccessBasicSubscription: true, entitlementSource: null, billingStatus: "ACTIVE", planCode: "STANDARD" } } as unknown as Parameters<typeof service.getExportData>[0], { from: "2026-03-01", to: "2026-03-31" }),
    ).rejects.toThrow("NOT_FOUND");
  });

  it("Basic 구독이 활성 상태가 아니면 export 데이터를 조회할 수 없다", async () => {
    await expect(
      service.getExportData({ workspaceId: 3, workspaceName: "WS", userId: 11, role: "ADMIN", membershipId: 1, entitlement: { canAccessBasicSubscription: false, entitlementSource: null, billingStatus: "NONE", planCode: "FREE" } } as unknown as Parameters<typeof service.getExportData>[0], { from: "2026-03-01", to: "2026-03-31" }),
    ).rejects.toThrow("BASIC_SUBSCRIPTION_REQUIRED");
  });

  it("기간/지표 기준 export 데이터를 집계해 반환한다", async () => {
    findActiveScoreboard.mockResolvedValue({
      id: 21,
      leadMeasures: [
        {
          id: 1,
          name: "물 2L",
          targetValue: 1,
          period: "DAILY",
          status: "ACTIVE",
        },
        {
          id: 2,
          name: "유산소",
          targetValue: 3,
          period: "WEEKLY",
          status: "ACTIVE",
        },
        {
          id: 3,
          name: "회고",
          targetValue: 5,
          period: "MONTHLY",
          status: "ACTIVE",
        },
        {
          id: 4,
          name: "보관 지표",
          targetValue: 7,
          period: "DAILY",
          status: "ARCHIVED",
        },
      ],
    });
    findLogsForLeadMeasures.mockResolvedValue([
      { leadMeasureId: 1, logDate: "2026-03-01", value: true },
      { leadMeasureId: 1, logDate: "2026-03-02", value: true },
      { leadMeasureId: 1, logDate: "2026-03-03", value: false },
      { leadMeasureId: 2, logDate: "2026-03-01", value: true },
      { leadMeasureId: 2, logDate: "2026-03-03", value: true },
      { leadMeasureId: 2, logDate: "2026-03-04", value: true },
      { leadMeasureId: 2, logDate: "2026-03-05", value: true },
      { leadMeasureId: 2, logDate: "2026-03-08", value: true },
      { leadMeasureId: 3, logDate: "2026-03-01", value: true },
      { leadMeasureId: 3, logDate: "2026-03-02", value: true },
      { leadMeasureId: 3, logDate: "2026-03-03", value: true },
      { leadMeasureId: 3, logDate: "2026-03-04", value: true },
      { leadMeasureId: 3, logDate: "2026-03-05", value: true },
      { leadMeasureId: 3, logDate: "2026-03-06", value: true },
    ]);

    const result = await service.getExportData({ workspaceId: 3, workspaceName: "WS", userId: 11, role: "ADMIN", membershipId: 1, entitlement: { canAccessBasicSubscription: true, entitlementSource: null, billingStatus: "ACTIVE", planCode: "STANDARD" } } as unknown as Parameters<typeof service.getExportData>[0], {
      from: "2026-03-01",
      to: "2026-03-10",
    });

    expect(findLogsForLeadMeasures).toHaveBeenCalledWith(
      [1, 2, 3],
      "2026-03-01",
      "2026-03-10",
    );
    expect(result.periodMeta).toEqual({
      from: "2026-03-01",
      to: "2026-03-10",
      dayCount: 10,
    });
    expect(result.summary).toEqual({
      achieved: 11,
      total: 24,
      achievementRate: 45.8,
      isWinning: false,
    });
    expect(result.leadMeasureBreakdown).toEqual([
      {
        leadMeasureId: 1,
        name: "물 2L",
        period: "DAILY",
        trackingMode: "BOOLEAN",
        dailyTargetCount: 1,
        achieved: 2,
        total: 10,
        achievementRate: 20,
      },
      {
        leadMeasureId: 2,
        name: "유산소",
        period: "WEEKLY",
        trackingMode: "BOOLEAN",
        dailyTargetCount: 1,
        achieved: 4,
        total: 9,
        achievementRate: 44.4,
      },
      {
        leadMeasureId: 3,
        name: "회고",
        period: "MONTHLY",
        trackingMode: "BOOLEAN",
        dailyTargetCount: 1,
        achieved: 5,
        total: 5,
        achievementRate: 100,
      },
    ]);
    expect(result.dailyRows).toHaveLength(30);
    expect(result.dailyRows[0]).toEqual({
      date: "2026-03-01",
      leadMeasureId: 1,
      leadMeasureName: "물 2L",
      period: "DAILY",
      trackingMode: "BOOLEAN",
      dailyTargetCount: 1,
      status: "ACHIEVED",
      count: 1,
    });
  });

  it("선택 지표만 필터링해 반환한다", async () => {
    findActiveScoreboard.mockResolvedValue({
      id: 21,
      leadMeasures: [
        {
          id: 1,
          name: "물 2L",
          targetValue: 1,
          period: "DAILY",
          status: "ACTIVE",
        },
        {
          id: 2,
          name: "유산소",
          targetValue: 3,
          period: "WEEKLY",
          status: "ACTIVE",
        },
      ],
    });
    findLogsForLeadMeasures.mockResolvedValue([]);

    const result = await service.getExportData({ workspaceId: 3, workspaceName: "WS", userId: 11, role: "ADMIN", membershipId: 1, entitlement: { canAccessBasicSubscription: true, entitlementSource: null, billingStatus: "ACTIVE", planCode: "STANDARD" } } as unknown as Parameters<typeof service.getExportData>[0], {
      from: "2026-03-01",
      to: "2026-03-02",
      leadMeasureIds: [2],
    });

    expect(findLogsForLeadMeasures).toHaveBeenCalledWith(
      [2],
      "2026-03-01",
      "2026-03-02",
    );
    expect(result.leadMeasureBreakdown).toEqual([
      {
        leadMeasureId: 2,
        name: "유산소",
        period: "WEEKLY",
        trackingMode: "BOOLEAN",
        dailyTargetCount: 1,
        achieved: 0,
        total: 6,
        achievementRate: 0,
      },
    ]);
    expect(result.dailyRows).toHaveLength(2);
  });
});
