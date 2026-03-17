import { NotFoundError } from "@/lib/server/errors";

const MS_PER_DAY = 86_400_000;

type WorkspacePort = {
  findUserWorkspace(userId: number): Promise<{ id: number } | null>;
};

type ActiveLeadMeasure = {
  id: number;
  name: string;
  targetValue: number;
  period: "DAILY" | "WEEKLY" | "MONTHLY";
  status: "ACTIVE" | "ARCHIVED";
};

type ScoreboardPort = {
  findActiveScoreboard(
    userId: number,
    workspaceId: number,
  ): Promise<{ id: number; leadMeasures: ActiveLeadMeasure[] } | undefined>;
};

type DailyLogPort = {
  findLogsForLeadMeasures(
    leadMeasureIds: number[],
    rangeStart: string,
    rangeEnd: string,
  ): Promise<Array<{ leadMeasureId: number; logDate: string; value: boolean }>>;
};

type ExportStatus = "ACHIEVED" | "MISSED" | "NOT_RECORDED";

type ExportMeasureBreakdown = {
  leadMeasureId: number;
  name: string;
  period: "DAILY" | "WEEKLY" | "MONTHLY";
  achieved: number;
  total: number;
  achievementRate: number;
};

type ExportRow = {
  date: string;
  leadMeasureId: number;
  leadMeasureName: string;
  status: ExportStatus;
};

export class AnalyticsService {
  constructor(
    private workspaceStorage: WorkspacePort,
    private scoreboardStorage: ScoreboardPort,
    private dailyLogStorage: DailyLogPort,
  ) {}

  async getExportData(
    userId: number,
    input: { from: string; to: string; leadMeasureIds?: number[] },
  ): Promise<{
    periodMeta: { from: string; to: string; dayCount: number };
    summary: {
      achieved: number;
      total: number;
      achievementRate: number;
      isWinning: boolean;
    };
    leadMeasureBreakdown: ExportMeasureBreakdown[];
    dailyRows: ExportRow[];
  }> {
    const workspace = await this.workspaceStorage.findUserWorkspace(userId);
    if (!workspace) {
      throw new NotFoundError("NOT_FOUND");
    }

    const scoreboard = await this.scoreboardStorage.findActiveScoreboard(
      userId,
      workspace.id,
    );
    if (!scoreboard) {
      throw new NotFoundError("NOT_FOUND");
    }

    const activeMeasures = scoreboard.leadMeasures
      .filter((measure) => measure.status === "ACTIVE")
      .sort((a, b) => a.id - b.id);

    const selectedMeasureIds = input.leadMeasureIds
      ? new Set(input.leadMeasureIds)
      : null;
    const measures = selectedMeasureIds
      ? activeMeasures.filter((measure) => selectedMeasureIds.has(measure.id))
      : activeMeasures;

    const dayCount = getDayCountInclusive(input.from, input.to);
    const dateRange = getDateRange(input.from, input.to);

    const logs = await this.dailyLogStorage.findLogsForLeadMeasures(
      measures.map((measure) => measure.id),
      input.from,
      input.to,
    );

    const logsByMeasureDate = new Map<string, boolean>();
    const trueCountByMeasureBucket = new Map<string, number>();

    for (const log of logs) {
      logsByMeasureDate.set(getMeasureDateKey(log.leadMeasureId, log.logDate), log.value);
      if (!log.value) {
        continue;
      }

      const measure = measures.find((item) => item.id === log.leadMeasureId);
      if (!measure) {
        continue;
      }

      const bucket = getBucketKey(measure.period, log.logDate);
      const key = getMeasureBucketKey(measure.id, bucket);
      trueCountByMeasureBucket.set(key, (trueCountByMeasureBucket.get(key) ?? 0) + 1);
    }

    const leadMeasureBreakdown = measures.map((measure) => {
      const buckets = getBucketsForPeriod(measure.period, dateRange);
      const total = buckets.length * measure.targetValue;
      const achieved = buckets.reduce((sum, bucket) => {
        const key = getMeasureBucketKey(measure.id, bucket);
        const truthyCount = trueCountByMeasureBucket.get(key) ?? 0;
        return sum + Math.min(truthyCount, measure.targetValue);
      }, 0);

      return {
        leadMeasureId: measure.id,
        name: measure.name,
        period: measure.period,
        achieved,
        total,
        achievementRate: getRate(achieved, total),
      };
    });

    const dailyRows: ExportRow[] = [];
    for (const date of dateRange) {
      for (const measure of measures) {
        const value = logsByMeasureDate.get(getMeasureDateKey(measure.id, date));
        const status: ExportStatus =
          value === true ? "ACHIEVED" : value === false ? "MISSED" : "NOT_RECORDED";

        dailyRows.push({
          date,
          leadMeasureId: measure.id,
          leadMeasureName: measure.name,
          status,
        });
      }
    }

    const summaryAchieved = leadMeasureBreakdown.reduce(
      (sum, measure) => sum + measure.achieved,
      0,
    );
    const summaryTotal = leadMeasureBreakdown.reduce(
      (sum, measure) => sum + measure.total,
      0,
    );
    const summaryRate = getRate(summaryAchieved, summaryTotal);

    return {
      periodMeta: {
        from: input.from,
        to: input.to,
        dayCount,
      },
      summary: {
        achieved: summaryAchieved,
        total: summaryTotal,
        achievementRate: summaryRate,
        isWinning: summaryRate >= 80,
      },
      leadMeasureBreakdown,
      dailyRows,
    };
  }
}

function getRate(achieved: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return Number(((achieved / total) * 100).toFixed(1));
}

function getMeasureDateKey(leadMeasureId: number, date: string) {
  return `${leadMeasureId}:${date}`;
}

function getMeasureBucketKey(leadMeasureId: number, bucket: string) {
  return `${leadMeasureId}:${bucket}`;
}

function getBucketKey(period: "DAILY" | "WEEKLY" | "MONTHLY", date: string) {
  if (period === "DAILY") {
    return date;
  }

  if (period === "WEEKLY") {
    return getWeekStart(date);
  }

  return date.slice(0, 7);
}

function getBucketsForPeriod(
  period: "DAILY" | "WEEKLY" | "MONTHLY",
  dates: string[],
) {
  if (period === "DAILY") {
    return dates;
  }

  if (period === "WEEKLY") {
    return [...new Set(dates.map((date) => getWeekStart(date)))];
  }

  return [...new Set(dates.map((date) => date.slice(0, 7)))];
}

function getDateRange(from: string, to: string) {
  const fromDate = parseDate(from);
  const toDate = parseDate(to);
  const range: string[] = [];

  for (
    let current = fromDate.getTime();
    current <= toDate.getTime();
    current += MS_PER_DAY
  ) {
    range.push(formatDate(new Date(current)));
  }

  return range;
}

function getDayCountInclusive(from: string, to: string) {
  const fromDate = parseDate(from);
  const toDate = parseDate(to);
  return Math.floor((toDate.getTime() - fromDate.getTime()) / MS_PER_DAY) + 1;
}

function getWeekStart(dateString: string) {
  const date = parseDate(dateString);
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(date.getTime() + diff * MS_PER_DAY);
  return formatDate(monday);
}

function parseDate(dateString: string) {
  const [yearRaw, monthRaw, dayRaw] = dateString.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}
