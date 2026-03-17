import { beforeEach, describe, expect, it, vi } from "vitest";
import { LeadMeasureService } from "@/domain/lead-measure/services/lead-measure.service";

describe("LeadMeasureService", () => {
  const findUserWorkspace = vi.fn();
  const findOwnedScoreboard = vi.fn();
  const findLeadMeasuresByScoreboard = vi.fn();
  const createLeadMeasure = vi.fn();
  const findOwnedLeadMeasure = vi.fn();
  const updateLeadMeasure = vi.fn();
  const archiveLeadMeasure = vi.fn();
  const reactivateLeadMeasure = vi.fn();
  const deleteLeadMeasure = vi.fn();
  const countLogsByLeadMeasure = vi.fn();
  const countTrueLogsByLeadMeasures = vi.fn();

  const service = new LeadMeasureService(
    { findUserWorkspace },
    { findOwnedScoreboard },
    {
      findLeadMeasuresByScoreboard,
      createLeadMeasure,
      findOwnedLeadMeasure,
      updateLeadMeasure,
      archiveLeadMeasure,
      reactivateLeadMeasure,
      deleteLeadMeasure,
    },
    { countLogsByLeadMeasure, countTrueLogsByLeadMeasures },
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("점수판의 활성 선행지표 목록을 주간 달성 수와 함께 반환한다", async () => {
    findUserWorkspace.mockResolvedValue({ id: 1 });
    findOwnedScoreboard.mockResolvedValue({ id: 2, status: "ACTIVE" });
    findLeadMeasuresByScoreboard.mockResolvedValue([
      { id: 10, name: "매일 물 2L", targetValue: 7, status: "ACTIVE" },
    ]);
    countTrueLogsByLeadMeasures.mockResolvedValue({ 10: 5 });

    const result = await service.getLeadMeasures(2, 100, "active");

    expect(result).toEqual([
      expect.objectContaining({
        id: 10,
        weeklyAchievement: { achieved: 5, total: 7 },
      }),
    ]);
  });

  it("ARCHIVED 점수판에는 선행지표를 추가할 수 없다", async () => {
    findUserWorkspace.mockResolvedValue({ id: 1 });
    findOwnedScoreboard.mockResolvedValue({
      id: 2,
      status: "ARCHIVED",
      startDate: "2026-03-01",
    });

    await expect(
      service.createLeadMeasure(2, 100, {
        name: "매일 물 2L",
        targetValue: 7,
        period: "DAILY",
      }),
    ).rejects.toThrow("SCOREBOARD_ARCHIVED");
  });

  it("ARCHIVED 선행지표는 수정할 수 없다", async () => {
    findUserWorkspace.mockResolvedValue({ id: 1 });
    findOwnedLeadMeasure.mockResolvedValue({
      id: 10,
      status: "ARCHIVED",
      scoreboard: { id: 2, status: "ACTIVE", startDate: "2026-03-01" },
    });

    await expect(
      service.updateLeadMeasure(10, 100, { name: "수정됨" }),
    ).rejects.toThrow("LEAD_MEASURE_ARCHIVED");
  });

  it("선행지표 삭제 시 연결된 로그 수를 포함한 경고를 반환한다", async () => {
    findUserWorkspace.mockResolvedValue({ id: 1 });
    findOwnedLeadMeasure.mockResolvedValue({
      id: 10,
      status: "ACTIVE",
      scoreboard: { id: 2, status: "ACTIVE", startDate: "2026-03-01" },
    });
    countLogsByLeadMeasure.mockResolvedValue(17);

    const result = await service.deleteLeadMeasure(10, 100);

    expect(deleteLeadMeasure).toHaveBeenCalledWith(10);
    expect(result).toEqual({
      warning: "삭제된 기록은 복구할 수 없습니다. 17개의 기록이 함께 삭제됩니다.",
      deleted: true,
    });
  });

  it("주간 목표 횟수는 7회를 초과할 수 없다", async () => {
    findUserWorkspace.mockResolvedValue({ id: 1 });
    findOwnedScoreboard.mockResolvedValue({
      id: 2,
      status: "ACTIVE",
      startDate: "2026-03-01",
    });

    await expect(
      service.createLeadMeasure(2, 100, {
        name: "주 8회 운동",
        targetValue: 8,
        period: "WEEKLY",
      }),
    ).rejects.toThrow("VALIDATION_ERROR");
    expect(createLeadMeasure).not.toHaveBeenCalled();
  });

  it("월간 목표 횟수는 점수판 시작월의 최대 일수를 초과할 수 없다", async () => {
    findUserWorkspace.mockResolvedValue({ id: 1 });
    findOwnedScoreboard.mockResolvedValue({
      id: 2,
      status: "ACTIVE",
      startDate: "2026-02-01",
    });

    await expect(
      service.createLeadMeasure(2, 100, {
        name: "월 29회 회고",
        targetValue: 29,
        period: "MONTHLY",
      }),
    ).rejects.toThrow("VALIDATION_ERROR");
    expect(createLeadMeasure).not.toHaveBeenCalled();
  });
});
