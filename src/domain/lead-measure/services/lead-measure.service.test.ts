import { beforeEach, describe, expect, it, vi } from "vitest";
import { LeadMeasureService } from "@/domain/lead-measure/services/lead-measure.service";

describe("LeadMeasureService", () => {
  const findUserWorkspace = vi.fn();
  const countMembers = vi.fn();
  const findPlanLimit = vi.fn();
  const findOwnedScoreboard = vi.fn();
  const findLeadMeasuresByScoreboard = vi.fn();
  const createLeadMeasure = vi.fn();
  const findOwnedLeadMeasure = vi.fn();
  const updateLeadMeasure = vi.fn();
  const archiveLeadMeasure = vi.fn();
  const reactivateLeadMeasure = vi.fn();
  const deleteLeadMeasure = vi.fn();
  const findTagsByIdsInWorkspace = vi.fn();
  const countLogsByLeadMeasure = vi.fn();
  const countTrueLogsByLeadMeasures = vi.fn();

  const service = new LeadMeasureService(
    { findUserWorkspace, countMembers, findPlanLimit },
    { findOwnedScoreboard },
    {
      findLeadMeasuresByScoreboard,
      createLeadMeasure,
      findOwnedLeadMeasure,
      updateLeadMeasure,
      archiveLeadMeasure,
      reactivateLeadMeasure,
      deleteLeadMeasure,
      findTagsByIdsInWorkspace,
    },
    { countLogsByLeadMeasure, countTrueLogsByLeadMeasures },
  );

  beforeEach(() => {
    vi.clearAllMocks();
    countMembers.mockResolvedValue(1);
    findPlanLimit.mockResolvedValue({ memberLimit: 10 });
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

  it("선행지표 생성 시 같은 워크스페이스 태그만 연결할 수 있다", async () => {
    findUserWorkspace.mockResolvedValue({ id: 1 });
    findOwnedScoreboard.mockResolvedValue({
      id: 2,
      workspaceId: 1,
      status: "ACTIVE",
      startDate: "2026-03-01",
    });
    findTagsByIdsInWorkspace.mockResolvedValue([{ id: 3, name: "운동" }]);
    createLeadMeasure.mockResolvedValue({
      id: 10,
      scoreboardId: 2,
      name: "주 3회 운동",
      targetValue: 3,
      period: "WEEKLY",
      status: "ACTIVE",
      tags: [{ id: 3, name: "운동" }],
    });

    const result = await service.createLeadMeasure(2, 100, {
      name: "주 3회 운동",
      targetValue: 3,
      period: "WEEKLY",
      tagIds: [3],
    });

    expect(findTagsByIdsInWorkspace).toHaveBeenCalledWith(1, [3]);
    expect(createLeadMeasure).toHaveBeenCalledWith({
      scoreboardId: 2,
      name: "주 3회 운동",
      targetValue: 3,
      period: "WEEKLY",
      tagIds: [3],
    });
    expect(result.tags).toEqual([{ id: 3, name: "운동" }]);
  });

  it("FREE 플랜 멤버 한도 초과 상태에서는 선행지표를 생성할 수 없다", async () => {
    findUserWorkspace.mockResolvedValue({ id: 1, planCode: "FREE" });
    countMembers.mockResolvedValue(11);
    findOwnedScoreboard.mockResolvedValue({
      id: 2,
      workspaceId: 1,
      status: "ACTIVE",
      startDate: "2026-03-01",
    });

    await expect(
      service.createLeadMeasure(2, 100, {
        name: "주 3회 운동",
        targetValue: 3,
        period: "WEEKLY",
      }),
    ).rejects.toThrow("FREE_PLAN_MEMBER_LIMIT_EXCEEDED");
    expect(createLeadMeasure).not.toHaveBeenCalled();
  });

  it("다른 워크스페이스 태그를 연결하려 하면 404 에러를 던진다", async () => {
    findUserWorkspace.mockResolvedValue({ id: 1 });
    findOwnedScoreboard.mockResolvedValue({
      id: 2,
      workspaceId: 1,
      status: "ACTIVE",
      startDate: "2026-03-01",
    });
    findTagsByIdsInWorkspace.mockResolvedValue([]);

    await expect(
      service.createLeadMeasure(2, 100, {
        name: "주 3회 운동",
        targetValue: 3,
        period: "WEEKLY",
        tagIds: [999],
      }),
    ).rejects.toThrow("NOT_FOUND");

    expect(createLeadMeasure).not.toHaveBeenCalled();
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

  it("선행지표 수정 시 태그를 교체할 수 있다", async () => {
    findUserWorkspace.mockResolvedValue({ id: 1 });
    findOwnedLeadMeasure.mockResolvedValue({
      id: 10,
      name: "주 3회 운동",
      targetValue: 3,
      period: "WEEKLY",
      status: "ACTIVE",
      scoreboard: { id: 2, workspaceId: 1, status: "ACTIVE", startDate: "2026-03-01" },
    });
    findTagsByIdsInWorkspace.mockResolvedValue([{ id: 4, name: "건강" }]);
    updateLeadMeasure.mockResolvedValue({
      id: 10,
      name: "주 3회 운동",
      targetValue: 3,
      period: "WEEKLY",
      status: "ACTIVE",
      tags: [{ id: 4, name: "건강" }],
    });

    const result = await service.updateLeadMeasure(10, 100, { tagIds: [4] });

    expect(findTagsByIdsInWorkspace).toHaveBeenCalledWith(1, [4]);
    expect(updateLeadMeasure).toHaveBeenCalledWith(10, { tagIds: [4] });
    expect(result.tags).toEqual([{ id: 4, name: "건강" }]);
  });

  it("이미 보관된 선행지표를 다시 보관할 수 없다", async () => {
    findUserWorkspace.mockResolvedValue({ id: 1 });
    findOwnedLeadMeasure.mockResolvedValue({
      id: 10,
      status: "ARCHIVED",
      scoreboard: { id: 2, status: "ACTIVE", startDate: "2026-03-01" },
    });

    await expect(service.archiveLeadMeasure(10, 100)).rejects.toThrow(
      "LEAD_MEASURE_ALREADY_ARCHIVED",
    );
    expect(archiveLeadMeasure).not.toHaveBeenCalled();
  });

  it("활성 선행지표를 바로 재활성화할 수 없다", async () => {
    findUserWorkspace.mockResolvedValue({ id: 1 });
    findOwnedLeadMeasure.mockResolvedValue({
      id: 10,
      status: "ACTIVE",
      scoreboard: { id: 2, status: "ACTIVE", startDate: "2026-03-01" },
    });

    await expect(service.reactivateLeadMeasure(10, 100)).rejects.toThrow(
      "LEAD_MEASURE_ALREADY_ACTIVE",
    );
    expect(reactivateLeadMeasure).not.toHaveBeenCalled();
  });

  it("보관된 선행지표는 재활성화할 수 있다", async () => {
    findUserWorkspace.mockResolvedValue({ id: 1 });
    findOwnedLeadMeasure.mockResolvedValue({
      id: 10,
      status: "ARCHIVED",
      scoreboard: { id: 2, status: "ACTIVE", startDate: "2026-03-01" },
    });
    reactivateLeadMeasure.mockResolvedValue({
      id: 10,
      status: "ACTIVE",
      archivedAt: null,
      tags: [],
    });

    const result = await service.reactivateLeadMeasure(10, 100);

    expect(reactivateLeadMeasure).toHaveBeenCalledWith(10);
    expect(result).toEqual({
      id: 10,
      status: "ACTIVE",
      archivedAt: null,
      tags: [],
    });
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
