import { beforeEach, describe, expect, it, vi } from "vitest";
import { DailyLogService } from "@/domain/daily-log/services/daily-log.service";

describe("DailyLogService", () => {
  const findUserWorkspace = vi.fn();
  const findOwnedScoreboard = vi.fn();
  const findOwnedLeadMeasure = vi.fn();
  const upsertLog = vi.fn();
  const deleteLog = vi.fn();
  const findLogsForLeadMeasures = vi.fn();
  const findLeadMeasuresByScoreboard = vi.fn();

  const service = new DailyLogService(
    { findUserWorkspace },
    { findOwnedScoreboard },
    { findOwnedLeadMeasure, findLeadMeasuresByScoreboard },
    { upsertLog, deleteLog, findLogsForLeadMeasures },
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("미래 날짜도 기록할 수 있다", async () => {
    findUserWorkspace.mockResolvedValue({ id: 1 });
    findOwnedLeadMeasure.mockResolvedValue({
      id: 10,
      status: "ACTIVE",
      scoreboard: { id: 2, status: "ACTIVE" },
    });
    upsertLog.mockResolvedValue({
      id: 1,
      leadMeasureId: 10,
      logDate: "2999-01-01",
      value: true,
    });

    await expect(service.upsertLog(10, 100, "2999-01-01", true)).resolves.toEqual({
      id: 1,
      leadMeasureId: 10,
      logDate: "2999-01-01",
      value: true,
    });
    expect(upsertLog).toHaveBeenCalledWith(10, "2999-01-01", true);
  });

  it("ARCHIVED 선행지표에는 기록할 수 없다", async () => {
    findUserWorkspace.mockResolvedValue({ id: 1 });
    findOwnedLeadMeasure.mockResolvedValue({
      id: 10,
      status: "ARCHIVED",
      scoreboard: { id: 2, status: "ACTIVE" },
    });

    await expect(
      service.upsertLog(10, 100, "2026-03-15", true),
    ).rejects.toThrow("LEAD_MEASURE_ARCHIVED");
  });

  it("주간 기록 조회 시 월~일 로그 맵과 달성률을 반환한다", async () => {
    findUserWorkspace.mockResolvedValue({ id: 1 });
    findOwnedScoreboard.mockResolvedValue({ id: 2, status: "ACTIVE" });
    findLeadMeasuresByScoreboard.mockResolvedValue([
      { id: 10, name: "매일 물 2L", targetValue: 7, status: "ACTIVE" },
    ]);
    findLogsForLeadMeasures.mockResolvedValue([
      { leadMeasureId: 10, logDate: "2026-03-09", value: true },
      { leadMeasureId: 10, logDate: "2026-03-10", value: false },
    ]);

    const result = await service.getWeeklyLogs(2, 100, "2026-03-09");

    expect(result).toEqual({
      weekStart: "2026-03-09",
      weekEnd: "2026-03-15",
      leadMeasures: [
        expect.objectContaining({
          id: 10,
          achieved: 1,
          achievementRate: expect.any(Number),
        }),
      ],
    });
  });

  it("주간 기록 조회 시 개별 지표 달성률은 100%를 초과하지 않는다", async () => {
    findUserWorkspace.mockResolvedValue({ id: 1 });
    findOwnedScoreboard.mockResolvedValue({ id: 2, status: "ACTIVE" });
    findLeadMeasuresByScoreboard.mockResolvedValue([
      {
        id: 10,
        name: "주 3회 유산소",
        targetValue: 3,
        period: "WEEKLY",
        status: "ACTIVE",
      },
    ]);
    findLogsForLeadMeasures.mockResolvedValue([
      { leadMeasureId: 10, logDate: "2026-03-09", value: true },
      { leadMeasureId: 10, logDate: "2026-03-10", value: true },
      { leadMeasureId: 10, logDate: "2026-03-11", value: true },
      { leadMeasureId: 10, logDate: "2026-03-12", value: true },
      { leadMeasureId: 10, logDate: "2026-03-13", value: true },
    ]);

    const result = await service.getWeeklyLogs(2, 100, "2026-03-09");

    expect(result.leadMeasures).toEqual([
      expect.objectContaining({
        id: 10,
        achieved: 5,
        achievementRate: 100,
      }),
    ]);
  });

  it("월간 기록 조회 시 WEEKLY와 MONTHLY 지표를 모두 반환한다", async () => {
    findUserWorkspace.mockResolvedValue({ id: 1 });
    findOwnedScoreboard.mockResolvedValue({ id: 2, status: "ACTIVE" });
    findLeadMeasuresByScoreboard.mockResolvedValue([
      {
        id: 10,
        name: "주 3회 유산소",
        targetValue: 3,
        period: "WEEKLY",
        status: "ACTIVE",
      },
      {
        id: 11,
        name: "월 12회 근력운동",
        targetValue: 12,
        period: "MONTHLY",
        status: "ACTIVE",
      },
    ]);
    findLogsForLeadMeasures.mockResolvedValue([
      { leadMeasureId: 10, logDate: "2026-03-02", value: true },
      { leadMeasureId: 10, logDate: "2026-03-03", value: true },
      { leadMeasureId: 10, logDate: "2026-03-05", value: true },
      { leadMeasureId: 11, logDate: "2026-03-01", value: true },
      { leadMeasureId: 11, logDate: "2026-03-03", value: true },
      { leadMeasureId: 11, logDate: "2026-03-04", value: false },
    ]);

    const result = await service.getMonthlyLogs(2, 100, "2026-03-01");

    expect(result.monthStart).toBe("2026-03-01");
    expect(result.monthEnd).toBe("2026-03-31");
    expect(result.monthLabel).toBe("2026.03");
    expect(result.summary).toEqual({
      achieved: 5,
      total: 30,
      achievementRate: 16.7,
      isWinning: false,
    });
    expect(result.leadMeasures).toHaveLength(2);
    expect(result.leadMeasures).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 10,
          period: "WEEKLY",
          achieved: 3,
        }),
        expect.objectContaining({
          id: 11,
          period: "MONTHLY",
          achieved: 2,
        }),
      ]),
    );
    expect(findLogsForLeadMeasures).toHaveBeenCalledWith(
      [10, 11],
      "2026-03-01",
      "2026-03-31",
    );
  });

  it("monthStart가 월 1일이 아니어도 해당 월의 1일로 정규화한다", async () => {
    findUserWorkspace.mockResolvedValue({ id: 1 });
    findOwnedScoreboard.mockResolvedValue({ id: 2, status: "ACTIVE" });
    findLeadMeasuresByScoreboard.mockResolvedValue([]);
    findLogsForLeadMeasures.mockResolvedValue([]);

    const result = await service.getMonthlyLogs(2, 100, "2026-03-18");

    expect(result.monthStart).toBe("2026-03-01");
    expect(result.monthEnd).toBe("2026-03-31");
    expect(result.monthLabel).toBe("2026.03");
  });

  it("주간 지표는 주차별 목표 상한(min)으로 월간 summary를 계산한다", async () => {
    findUserWorkspace.mockResolvedValue({ id: 1 });
    findOwnedScoreboard.mockResolvedValue({ id: 2, status: "ACTIVE" });
    findLeadMeasuresByScoreboard.mockResolvedValue([
      {
        id: 10,
        name: "주 3회 유산소",
        targetValue: 3,
        period: "WEEKLY",
        status: "ACTIVE",
      },
    ]);
    findLogsForLeadMeasures.mockResolvedValue([
      { leadMeasureId: 10, logDate: "2026-03-03", value: true },
      { leadMeasureId: 10, logDate: "2026-03-04", value: true },
      { leadMeasureId: 10, logDate: "2026-03-05", value: true },
      { leadMeasureId: 10, logDate: "2026-03-06", value: true },
      { leadMeasureId: 10, logDate: "2026-03-07", value: true },
      { leadMeasureId: 10, logDate: "2026-03-08", value: true },
    ]);

    const result = await service.getMonthlyLogs(2, 100, "2026-03-01");

    expect(result.summary).toEqual({
      achieved: 3,
      total: 18,
      achievementRate: 16.7,
      isWinning: false,
    });
  });
});
