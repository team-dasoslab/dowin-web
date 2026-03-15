import { beforeEach, describe, expect, it, vi } from "vitest";
import { DailyLogStorage } from "@/domain/daily-log/storage/daily-log.storage";

describe("DailyLogStorage", () => {
  const findMany = vi.fn();
  const insert = vi.fn();
  const values = vi.fn();
  const onConflictDoUpdate = vi.fn();
  const returning = vi.fn();
  const deleteFn = vi.fn();
  const where = vi.fn();

  const storage = new DailyLogStorage({
    query: {
      dailyLogs: {
        findMany: (args) => findMany(args),
      },
    },
    insert: (table) => {
      insert(table);
      return {
        values: (input) => {
          values(input);
          return {
            onConflictDoUpdate: (input2) => {
              onConflictDoUpdate(input2);
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

  it("일일 기록을 upsert 한다", async () => {
    returning.mockResolvedValue([{ id: 1, value: true }]);

    const result = await storage.upsertLog(10, "2026-03-15", true);

    expect(result).toEqual({ id: 1, value: true });
    expect(onConflictDoUpdate).toHaveBeenCalled();
  });

  it("여러 선행지표의 기간 내 로그를 조회한다", async () => {
    findMany.mockResolvedValue([{ id: 1 }]);

    const result = await storage.findLogsForLeadMeasures(
      [10],
      "2026-03-09",
      "2026-03-15",
    );

    expect(result).toEqual([{ id: 1 }]);
    expect(findMany).toHaveBeenCalled();
  });
});
