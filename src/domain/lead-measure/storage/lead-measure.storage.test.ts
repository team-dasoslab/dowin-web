import { DowinDatabase } from "@/db";
import { LeadMeasureStorage } from "@/domain/lead-measure/storage/lead-measure.storage";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("LeadMeasureStorage", () => {
  const findMany = vi.fn();
  const findFirst = vi.fn();
  const returning = vi.fn();
  const where = vi.fn().mockReturnValue({ returning });
  const set = vi.fn().mockReturnValue({ where });
  const update = vi.fn().mockReturnValue({ set });
  const values = vi.fn().mockReturnValue({ returning });
  const insert = vi.fn().mockReturnValue({ values });

  const deleteWhere = vi.fn();
  const deleteFn = vi.fn().mockReturnValue({ where: deleteWhere });

  const mockDb = {
    query: {
      leadMeasures: {
        findMany,
        findFirst,
      },
      workspaceTags: {
        findMany: vi.fn(),
      },
      scoreboards: {
        findFirst: vi.fn(),
      },
      actionItemPublicIds: {
        findFirst: vi.fn(),
      },
    },
    insert,
    update,
    delete: deleteFn,
  } as unknown as DowinDatabase;
  const storage = new LeadMeasureStorage(mockDb);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("점수판의 선행지표 목록을 조회한다", async () => {
    findMany.mockResolvedValue([{ id: 1 }]);

    const result = await storage.findLeadMeasuresByScoreboard(2, "active");

    expect(result).toEqual([{ id: 1, tags: [] }]);
    expect(findMany).toHaveBeenCalled();
  });

  it("선행지표를 생성한다", async () => {
    returning.mockResolvedValue([{ id: 1 }]);
    findFirst.mockResolvedValue({ id: 1 });

    const result = await storage.createLeadMeasure({
      scoreboardId: 2,
      name: "매일 물 2L",
      targetValue: 7,
      period: "DAILY",
    });

    expect(result).toEqual({ id: 1, tags: [] });
  });
});
