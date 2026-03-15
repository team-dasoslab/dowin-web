import { and, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { dailyLogs } from "@/db/schema";

export type DailyLogRecord = typeof dailyLogs.$inferSelect;

export interface DailyLogDbPort {
  query: {
    dailyLogs: {
      findMany(args: unknown): Promise<unknown>;
    };
  };
  insert(table: unknown): {
    values(input: unknown): {
      onConflictDoUpdate(input: unknown): {
        returning(): Promise<unknown>;
      };
    };
  };
  delete(table: unknown): {
    where(condition: unknown): Promise<unknown>;
  };
}

export class DailyLogStorage {
  constructor(private db: DailyLogDbPort) {}

  async upsertLog(
    leadMeasureId: number,
    logDate: string,
    value: boolean,
  ): Promise<DailyLogRecord> {
    const [record] = (await this.db
      .insert(dailyLogs)
      .values({ leadMeasureId, logDate, value })
      .onConflictDoUpdate({
        target: [dailyLogs.leadMeasureId, dailyLogs.logDate],
        set: { value },
      })
      .returning()) as DailyLogRecord[];

    return record;
  }

  async deleteLog(leadMeasureId: number, logDate: string): Promise<void> {
    await this.db
      .delete(dailyLogs)
      .where(
        and(
          eq(dailyLogs.leadMeasureId, leadMeasureId),
          eq(dailyLogs.logDate, logDate),
        ),
      );
  }

  async findLogsForLeadMeasures(
    leadMeasureIds: number[],
    weekStart: string,
    weekEnd: string,
  ): Promise<DailyLogRecord[]> {
    if (leadMeasureIds.length === 0) {
      return [];
    }

    return (await this.db.query.dailyLogs.findMany({
      where: and(
        inArray(dailyLogs.leadMeasureId, leadMeasureIds),
        gte(dailyLogs.logDate, weekStart),
        lte(dailyLogs.logDate, weekEnd),
      ),
    })) as DailyLogRecord[];
  }

  async countLogsByLeadMeasure(leadMeasureId: number): Promise<number> {
    const records = (await this.db.query.dailyLogs.findMany({
      where: eq(dailyLogs.leadMeasureId, leadMeasureId),
    })) as DailyLogRecord[];

    return records.length;
  }

  async countTrueLogsByLeadMeasures(
    leadMeasureIds: number[],
    weekStart: string,
    weekEnd: string,
  ): Promise<Record<number, number>> {
    const logs = await this.findLogsForLeadMeasures(leadMeasureIds, weekStart, weekEnd);

    return logs.reduce<Record<number, number>>((acc, log) => {
      if (log.value) {
        acc[log.leadMeasureId] = (acc[log.leadMeasureId] ?? 0) + 1;
      }
      return acc;
    }, {});
  }
}
