import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DailyLogService } from "@/domain/daily-log/services/daily-log.service";

describe("DailyLogService", () => {
  const oldCreatedAt = new Date("2026-02-20T00:00:00.000Z");
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
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-09T12:00:00+09:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("이번 주 이전 날짜는 기록할 수 없다", async () => {
    await expect(service.upsertLog(10, 100, "2026-04-05", true)).rejects.toThrow(
      "PAST_WEEK_LOG_EDIT_NOT_ALLOWED",
    );
    expect(findOwnedLeadMeasure).not.toHaveBeenCalled();
    expect(upsertLog).not.toHaveBeenCalled();
  });

  it("이번 주 이전 날짜는 삭제할 수 없다", async () => {
    await expect(service.deleteLog(10, 100, "2026-04-05")).rejects.toThrow(
      "PAST_WEEK_LOG_EDIT_NOT_ALLOWED",
    );
    expect(findOwnedLeadMeasure).not.toHaveBeenCalled();
    expect(deleteLog).not.toHaveBeenCalled();
  });

  it("이번 주 날짜는 기록할 수 있다", async () => {
    findUserWorkspace.mockResolvedValue({ id: 1 });
    findOwnedLeadMeasure.mockResolvedValue({
      id: 10,
      status: "ACTIVE",
      scoreboard: { id: 2, status: "ACTIVE" },
    });
    upsertLog.mockResolvedValue({
      id: 1,
      leadMeasureId: 10,
      logDate: "2026-04-09",
      value: true,
    });

    await expect(service.upsertLog(10, 100, "2026-04-09", true)).resolves.toEqual({
      id: 1,
      leadMeasureId: 10,
      logDate: "2026-04-09",
      value: true,
    });
    expect(upsertLog).toHaveBeenCalledWith(10, "2026-04-09", true);
  });

  it("ARCHIVED 선행지표에는 기록할 수 없다", async () => {
    findUserWorkspace.mockResolvedValue({ id: 1 });
    findOwnedLeadMeasure.mockResolvedValue({
      id: 10,
      status: "ARCHIVED",
      scoreboard: { id: 2, status: "ACTIVE" },
    });

    await expect(
      service.upsertLog(10, 100, "2026-04-09", true),
    ).rejects.toThrow("LEAD_MEASURE_ARCHIVED");
  });

  it("주간 기록 조회 시 월~일 로그 맵과 달성률을 반환한다", async () => {
    findUserWorkspace.mockResolvedValue({ id: 1 });
    findOwnedScoreboard.mockResolvedValue({ id: 2, status: "ACTIVE" });
    findLeadMeasuresByScoreboard.mockResolvedValue([
      {
        id: 10,
        name: "매일 물 2L",
        targetValue: 7,
        status: "ACTIVE",
        createdAt: oldCreatedAt,
      },
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
        createdAt: oldCreatedAt,
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

  it("주간 기록 조회 시 2주 연속 0회면 선행지표 변경 제안을 반환한다", async () => {
    findUserWorkspace.mockResolvedValue({ id: 1 });
    findOwnedScoreboard.mockResolvedValue({ id: 2, status: "ACTIVE" });
    findLeadMeasuresByScoreboard.mockResolvedValue([
      {
        id: 10,
        name: "주 3회 유산소",
        targetValue: 3,
        period: "WEEKLY",
        status: "ACTIVE",
        createdAt: oldCreatedAt,
      },
    ]);
    findLogsForLeadMeasures.mockResolvedValue([]);

    const result = await service.getWeeklyLogs(2, 100, "2026-03-09");

    expect(result.leadMeasures).toEqual([
      expect.objectContaining({
        id: 10,
        guide: {
          kind: "change",
          description:
            "2주 연속 기록이 없어요. 이 선행지표는 다른 행동으로 바꿔보세요.",
        },
      }),
    ]);
    expect(findLogsForLeadMeasures).toHaveBeenCalledWith(
      [10],
      "2026-03-02",
      "2026-03-15",
    );
  });

  it("주간 기록 조회 시 2주 연속 50% 미만이면 횟수 조정 제안을 반환한다", async () => {
    findUserWorkspace.mockResolvedValue({ id: 1 });
    findOwnedScoreboard.mockResolvedValue({ id: 2, status: "ACTIVE" });
    findLeadMeasuresByScoreboard.mockResolvedValue([
      {
        id: 10,
        name: "주 4회 독서",
        targetValue: 4,
        period: "WEEKLY",
        status: "ACTIVE",
        createdAt: oldCreatedAt,
      },
    ]);
    findLogsForLeadMeasures.mockResolvedValue([
      { leadMeasureId: 10, logDate: "2026-03-03", value: true },
      { leadMeasureId: 10, logDate: "2026-03-10", value: true },
    ]);

    const result = await service.getWeeklyLogs(2, 100, "2026-03-09");

    expect(result.leadMeasures).toEqual([
      expect.objectContaining({
        id: 10,
        guide: {
          kind: "adjust",
          description:
            "2주 연속 50% 미만이에요. 이 선행지표는 횟수를 조금 낮춰보세요.",
        },
      }),
    ]);
  });

  it("주간 기록 조회 시 2주 연속 50% 이상이면 가이드를 반환하지 않는다", async () => {
    findUserWorkspace.mockResolvedValue({ id: 1 });
    findOwnedScoreboard.mockResolvedValue({ id: 2, status: "ACTIVE" });
    findLeadMeasuresByScoreboard.mockResolvedValue([
      {
        id: 10,
        name: "주 4회 독서",
        targetValue: 4,
        period: "WEEKLY",
        status: "ACTIVE",
        createdAt: oldCreatedAt,
      },
    ]);
    findLogsForLeadMeasures.mockResolvedValue([
      { leadMeasureId: 10, logDate: "2026-03-03", value: true },
      { leadMeasureId: 10, logDate: "2026-03-04", value: true },
      { leadMeasureId: 10, logDate: "2026-03-10", value: true },
      { leadMeasureId: 10, logDate: "2026-03-11", value: true },
    ]);

    const result = await service.getWeeklyLogs(2, 100, "2026-03-09");

    expect(result.leadMeasures).toEqual([
      expect.objectContaining({
        id: 10,
        guide: null,
      }),
    ]);
  });

  it("직전 주 시작 이후에 생성된 지표에는 가이드를 붙이지 않는다", async () => {
    findUserWorkspace.mockResolvedValue({ id: 1 });
    findOwnedScoreboard.mockResolvedValue({ id: 2, status: "ACTIVE" });
    findLeadMeasuresByScoreboard.mockResolvedValue([
      {
        id: 10,
        name: "주 3회 유산소",
        targetValue: 3,
        period: "WEEKLY",
        status: "ACTIVE",
        createdAt: new Date("2026-03-05T00:00:00.000Z"),
      },
    ]);
    findLogsForLeadMeasures.mockResolvedValue([]);

    const result = await service.getWeeklyLogs(2, 100, "2026-03-09");

    expect(result.leadMeasures).toEqual([
      expect.objectContaining({
        id: 10,
        guide: null,
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
        createdAt: oldCreatedAt,
      },
      {
        id: 11,
        name: "월 12회 근력운동",
        targetValue: 12,
        period: "MONTHLY",
        status: "ACTIVE",
        createdAt: oldCreatedAt,
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
        createdAt: oldCreatedAt,
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
