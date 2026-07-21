import { DowinDatabase } from "@/db";
import { scoreboards } from "@/db/schema";
import { ScoreboardStorage } from "@/domain/scoreboard/storage/scoreboard.storage";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("ScoreboardStorage", () => {
  const findFirst = vi.fn();
  const findMany = vi.fn();
  const returning = vi.fn();
  const where = vi.fn().mockReturnValue({ returning });
  const set = vi.fn().mockReturnValue({ where });
  const update = vi.fn().mockReturnValue({ set });
  const values = vi.fn().mockReturnValue({ returning });
  const insert = vi.fn().mockReturnValue({ values });

  const mockDb = {
    query: {
      scoreboards: {
        findFirst,
        findMany,
      },
    },
    insert,
    update,
  } as unknown as DowinDatabase;

  const storage = new ScoreboardStorage(mockDb);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("활성 점수판을 조회한다", async () => {
    findFirst.mockResolvedValue({
      id: 1,
      leadMeasures: [
        {
          id: 10,
          name: "주 3회 운동",
          tags: [{ tag: { id: 3, name: "운동" } }],
        },
      ],
    });

    const result = await storage.findActiveScoreboard(1, 2);

    expect(result).toEqual({
      id: 1,
      leadMeasures: [
        {
          id: 10,
          name: "주 3회 운동",
          tags: [{ id: 3, name: "운동" }],
        },
      ],
    });
    expect(findFirst).toHaveBeenCalled();
  });

  it("점수판을 생성한다", async () => {
    returning.mockResolvedValue([{ id: 1 }]);

    const result = await storage.createScoreboard({
      userId: 1,
      workspaceId: 2,
      goalName: "체중을 감량한다",
      lagMeasure: "80kg에서 75kg까지 달성",
      startDate: "2026-03-15",
      endDate: null,
    });

    expect(result).toEqual({ id: 1 });
    expect(insert).toHaveBeenCalledWith(scoreboards);
  });

  it("보관된 점수판 목록을 조회한다", async () => {
    findMany.mockResolvedValue([{ id: 1 }]);

    const result = await storage.findArchivedScoreboards(1, 2);

    expect(result).toEqual([{ id: 1 }]);
    expect(findMany).toHaveBeenCalled();
  });

  it("점수판을 보관하면서 종료일을 저장한다", async () => {
    returning.mockResolvedValue([{ id: 1, status: "ARCHIVED" }]);

    const result = await storage.archiveScoreboard(1, "2026-03-16");

    expect(result).toEqual({ id: 1, status: "ARCHIVED" });
    expect(set).toHaveBeenCalledWith({
      status: "ARCHIVED",
      endDate: "2026-03-16",
    });
  });

  it("점수판을 재활성화하면서 종료일을 비운다", async () => {
    returning.mockResolvedValue([{ id: 1, status: "ACTIVE" }]);

    const result = await storage.reactivateScoreboard(1);

    expect(result).toEqual({ id: 1, status: "ACTIVE" });
    expect(set).toHaveBeenCalledWith({
      status: "ACTIVE",
      endDate: null,
    });
  });
});
