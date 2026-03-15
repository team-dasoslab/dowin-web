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

  it("미래 날짜 기록 시 400 에러를 던진다", async () => {
    findUserWorkspace.mockResolvedValue({ id: 1 });
    findOwnedLeadMeasure.mockResolvedValue({
      id: 10,
      status: "ACTIVE",
      scoreboard: { id: 2, status: "ACTIVE" },
    });

    await expect(
      service.upsertLog(10, 100, "2999-01-01", true),
    ).rejects.toThrow("FUTURE_DATE_NOT_ALLOWED");
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
});
