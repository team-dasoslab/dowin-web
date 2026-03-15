import { beforeEach, describe, expect, it, vi } from "vitest";
import { LeadMeasureStorage } from "@/domain/lead-measure/storage/lead-measure.storage";

describe("LeadMeasureStorage", () => {
  const findMany = vi.fn();
  const findFirst = vi.fn();
  const insert = vi.fn();
  const values = vi.fn();
  const returning = vi.fn();
  const update = vi.fn();
  const set = vi.fn();
  const where = vi.fn();
  const deleteFn = vi.fn();

  const storage = new LeadMeasureStorage({
    query: {
      leadMeasures: {
        findMany: (args) => findMany(args),
        findFirst: (args) => findFirst(args),
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
    delete: (table) => {
      deleteFn(table);
      return {
        where: async (condition) => {
          where(condition);
        },
      };
    },
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("점수판의 선행지표 목록을 조회한다", async () => {
    findMany.mockResolvedValue([{ id: 1 }]);

    const result = await storage.findLeadMeasuresByScoreboard(2, "active");

    expect(result).toEqual([{ id: 1 }]);
    expect(findMany).toHaveBeenCalled();
  });

  it("선행지표를 생성한다", async () => {
    returning.mockResolvedValue([{ id: 1 }]);

    const result = await storage.createLeadMeasure({
      scoreboardId: 2,
      name: "매일 물 2L",
      targetValue: 7,
      period: "DAILY",
    });

    expect(result).toEqual({ id: 1 });
  });
});
