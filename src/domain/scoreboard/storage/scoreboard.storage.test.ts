import { beforeEach, describe, expect, it, vi } from "vitest";
import { scoreboards } from "@/db/schema";
import { ScoreboardDbPort, ScoreboardStorage } from "@/domain/scoreboard/storage/scoreboard.storage";

describe("ScoreboardStorage", () => {
  const findFirst = vi.fn();
  const findMany = vi.fn();
  const insert = vi.fn().mockReturnThis();
  const values = vi.fn().mockReturnThis();
  const returning = vi.fn();
  const update = vi.fn().mockReturnThis();
  const set = vi.fn().mockReturnThis();
  const where = vi.fn().mockReturnThis();

  const mockDb: ScoreboardDbPort = {
    query: {
      scoreboards: {
        findFirst: (args) => findFirst(args),
        findMany: (args) => findMany(args),
      },
    },
    insert: (table) => {
      insert(table);
      return {
        values: (input) => {
          values(input);
          return {
            returning: () => returning(),
          };
        },
      };
    },
    update: (table) => {
      update(table);
      return {
        set: (input) => {
          set(input);
          return {
            where: (condition) => {
              where(condition);
              return {
                returning: () => returning(),
              };
            },
          };
        },
      };
    },
  };

  const storage = new ScoreboardStorage(mockDb);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("활성 점수판을 조회한다", async () => {
    findFirst.mockResolvedValue({ id: 1 });

    const result = await storage.findActiveScoreboard(1, 2);

    expect(result).toEqual({ id: 1 });
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
