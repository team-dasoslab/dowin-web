import { DailyLogStorage } from "@/domain/daily-log/storage/daily-log.storage";
import {
  LeadMeasureForPushRecord,
  LeadMeasureStorage,
} from "@/domain/lead-measure/storage/lead-measure.storage";
import {
  breakWeeklyFocusTie as breakWeeklyFocusTieWithAi,
  createWeeklyFocusAiConfig,
} from "@/domain/notification/services/weekly-focus-ai";
import {
  chooseWeeklyFocusCandidate,
  computeWeeklyExecutionRate,
  type WeeklyFocusCandidate,
} from "@/domain/notification/services/weekly-focus-selector";
import { ScoreboardStorage } from "@/domain/scoreboard/storage/scoreboard.storage";

export type WeeklyFocusPushSubscription = {
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

export type WeeklyFocusPushJob = {
  userId: number;
  scoreboardId: number;
  leadMeasureId: number;
  endpoint: string;
  p256dh: string;
  auth: string;
  title: string;
  body: string;
  url: "/dashboard/my";
};

export type WeeklyFocusJobsResult = {
  jobs: WeeklyFocusPushJob[];
  summary: {
    totalSubscriptions: number;
    totalJobs: number;
    skippedNoActiveScoreboard: number;
    skippedNoEligibleLeadMeasures: number;
    aiTieBreaks: number;
  };
};

type PushSubscriptionLookupPort = {
  findAllPushSubscriptions(): Promise<WeeklyFocusPushSubscription[]>;
};

type ScoreboardLookupPort = Pick<
  ScoreboardStorage,
  "findActiveScoreboardsForPush"
>;

type LeadMeasureLookupPort = Pick<
  LeadMeasureStorage,
  "findActiveLeadMeasuresByScoreboardIds"
>;

type DailyLogSummaryPort = Pick<
  DailyLogStorage,
  "countTrueLogsForLeadMeasuresInRange"
>;

type WeeklyFocusAiPort = {
  breakWeeklyFocusTie: typeof breakWeeklyFocusTieWithAi;
};

const PUSH_TITLE = "리마인드";

export class WeeklyFocusPushService {
  constructor(
    private pushSubscriptionStorage: PushSubscriptionLookupPort,
    private scoreboardStorage: ScoreboardLookupPort,
    private leadMeasureStorage: LeadMeasureLookupPort,
    private dailyLogStorage: DailyLogSummaryPort,
    private weeklyFocusAi: WeeklyFocusAiPort = {
      breakWeeklyFocusTie: breakWeeklyFocusTieWithAi,
    },
  ) {}

  async buildWeeklyFocusJobs(input?: {
    now?: Date;
    googleApiKey?: string;
  }): Promise<WeeklyFocusJobsResult> {
    const now = input?.now ?? new Date();
    const subscriptions =
      await this.pushSubscriptionStorage.findAllPushSubscriptions();
    const summary = {
      totalSubscriptions: subscriptions.length,
      totalJobs: 0,
      skippedNoActiveScoreboard: 0,
      skippedNoEligibleLeadMeasures: 0,
      aiTieBreaks: 0,
    };

    if (subscriptions.length === 0) {
      return { jobs: [], summary };
    }

    const scoreboards =
      await this.scoreboardStorage.findActiveScoreboardsForPush();
    if (scoreboards.length === 0) {
      return {
        jobs: [],
        summary: {
          ...summary,
          skippedNoActiveScoreboard: subscriptions.length,
        },
      };
    }

    const scoreboardsByUserId = scoreboards.reduce<
      Map<number, (typeof scoreboards)[number][]>
    >((map, scoreboard) => {
      const userScoreboards = map.get(scoreboard.userId) ?? [];
      userScoreboards.push(scoreboard);
      map.set(scoreboard.userId, userScoreboards);
      return map;
    }, new Map());
    const leadMeasures =
      await this.leadMeasureStorage.findActiveLeadMeasuresByScoreboardIds(
        scoreboards.map((scoreboard) => scoreboard.id),
      );
    const progress = getCurrentKstProgress(now);
    const weekBasedLeadMeasures = leadMeasures.filter(
      (leadMeasure) => leadMeasure.period !== "MONTHLY",
    );
    const monthlyLeadMeasures = leadMeasures.filter(
      (leadMeasure) => leadMeasure.period === "MONTHLY",
    );
    const weekTrueLogCounts = weekBasedLeadMeasures.length
      ? await this.dailyLogStorage.countTrueLogsForLeadMeasuresInRange(
          weekBasedLeadMeasures.map((leadMeasure) => leadMeasure.id),
          progress.weekStart,
          progress.today,
        )
      : {};
    const monthTrueLogCounts = monthlyLeadMeasures.length
      ? await this.dailyLogStorage.countTrueLogsForLeadMeasuresInRange(
          monthlyLeadMeasures.map((leadMeasure) => leadMeasure.id),
          progress.monthStart,
          progress.today,
        )
      : {};
    const leadMeasuresByScoreboardId = groupByScoreboardId(
      leadMeasures.filter(
        (leadMeasure) =>
          getExpectedCountForCurrentProgress(leadMeasure, progress) > 0,
      ),
    );

    const jobs: WeeklyFocusPushJob[] = [];

    const subscriptionsByUserId = subscriptions.reduce<
      Map<number, WeeklyFocusPushSubscription[]>
    >((map, subscription) => {
      const userId = Number(subscription.userId);
      if (!Number.isInteger(userId)) {
        return map;
      }
      const userSubscriptions = map.get(userId) ?? [];
      userSubscriptions.push(subscription);
      map.set(userId, userSubscriptions);
      return map;
    }, new Map());

    for (const [userId, userSubscriptions] of subscriptionsByUserId) {
      const userScoreboards = scoreboardsByUserId.get(userId) ?? [];
      const scoreboard = selectCurrentActiveScoreboard(userScoreboards);

      if (!scoreboard) {
        summary.skippedNoActiveScoreboard += userSubscriptions.length;
        continue;
      }

      const scoreboardLeadMeasures =
        leadMeasuresByScoreboardId.get(scoreboard.id) ?? [];
      if (scoreboardLeadMeasures.length === 0) {
        summary.skippedNoEligibleLeadMeasures += 1;
        continue;
      }

      const candidates = scoreboardLeadMeasures.map((leadMeasure) =>
        toWeeklyFocusCandidate(
          leadMeasure,
          leadMeasure.period === "MONTHLY"
            ? monthTrueLogCounts[leadMeasure.id] ?? 0
            : weekTrueLogCounts[leadMeasure.id] ?? 0,
          progress,
        ),
      );
      const selection = chooseWeeklyFocusCandidate(candidates);

      if (selection.kind === "none") {
        summary.skippedNoEligibleLeadMeasures += 1;
        continue;
      }

      const selectedCandidate =
        selection.kind === "direct"
          ? selection.candidate
          : await this.resolveTie({
              goalName: scoreboard.goalName,
              candidates: selection.candidates,
              googleApiKey: input?.googleApiKey,
              summary,
            });

      for (const subscription of userSubscriptions) {
        jobs.push({
          userId,
          scoreboardId: scoreboard.id,
          leadMeasureId: selectedCandidate.id,
          endpoint: subscription.endpoint,
          p256dh: subscription.p256dh,
          auth: subscription.auth,
          title: PUSH_TITLE,
          body: `오늘은 ${selectedCandidate.name} 해볼까요?`,
          url: "/dashboard/my",
        });
        summary.totalJobs += 1;
      }
    }

    return { jobs, summary };
  }

  private async resolveTie(input: {
    goalName: string;
    candidates: WeeklyFocusCandidate[];
    googleApiKey?: string;
    summary: WeeklyFocusJobsResult["summary"];
  }) {
    if (!input.googleApiKey) {
      return input.candidates[0];
    }

    input.summary.aiTieBreaks += 1;

    const selectedLeadMeasureId = await this.weeklyFocusAi.breakWeeklyFocusTie(
      {
        goalName: input.goalName,
        candidates: input.candidates,
      },
      createWeeklyFocusAiConfig({ apiKey: input.googleApiKey }),
    );

    return (
      input.candidates.find(
        (candidate) => candidate.id === selectedLeadMeasureId,
      ) ?? input.candidates[0]
    );
  }
}

function toWeeklyFocusCandidate(
  leadMeasure: Pick<
    LeadMeasureForPushRecord,
    "id" | "name" | "targetValue" | "period"
  >,
  achieved: number,
  progress: ReturnType<typeof getCurrentKstProgress>,
): WeeklyFocusCandidate {
  const expected = getExpectedCountForCurrentProgress(leadMeasure, progress);

  return {
    id: leadMeasure.id,
    name: leadMeasure.name,
    description: null,
    achieved,
    expected,
    rate: computeWeeklyExecutionRate({
      achieved,
      expected,
    }),
  };
}

function groupByScoreboardId(
  leadMeasures: Array<
    Pick<
      LeadMeasureForPushRecord,
      "id" | "scoreboardId" | "name" | "targetValue" | "period"
    >
  >,
) {
  return leadMeasures.reduce<
    Map<
      number,
      Array<
        Pick<
          LeadMeasureForPushRecord,
          "id" | "scoreboardId" | "name" | "targetValue" | "period"
        >
      >
    >
  >((map, leadMeasure) => {
    const measures = map.get(leadMeasure.scoreboardId) ?? [];
    measures.push(leadMeasure);
    map.set(leadMeasure.scoreboardId, measures);
    return map;
  }, new Map());
}

function getExpectedCountForCurrentProgress(
  leadMeasure: Pick<LeadMeasureForPushRecord, "targetValue" | "period">,
  progress: ReturnType<typeof getCurrentKstProgress>,
) {
  if (leadMeasure.targetValue <= 0) {
    return 0;
  }

  if (leadMeasure.period === "MONTHLY") {
    return Math.ceil(
      (leadMeasure.targetValue * progress.monthElapsedDays) /
        progress.daysInMonth,
    );
  }

  return Math.ceil((leadMeasure.targetValue * progress.weekElapsedDays) / 7);
}

function getCurrentKstProgress(now: Date) {
  const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const today = formatUtcDate(
    new Date(
      Date.UTC(
        kstNow.getUTCFullYear(),
        kstNow.getUTCMonth(),
        kstNow.getUTCDate(),
      ),
    ),
  );
  const todayDate = parseUtcDate(today);
  const day = todayDate.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(todayDate.getTime() + diff * 24 * 60 * 60 * 1000);
  const weekStart = formatUtcDate(monday);
  const weekElapsedDays =
    Math.floor(
      (todayDate.getTime() - monday.getTime()) / (24 * 60 * 60 * 1000),
    ) + 1;
  const monthStartDate = new Date(
    Date.UTC(todayDate.getUTCFullYear(), todayDate.getUTCMonth(), 1),
  );
  const monthStart = formatUtcDate(monthStartDate);
  const monthElapsedDays = todayDate.getUTCDate();
  const daysInMonth = new Date(
    Date.UTC(todayDate.getUTCFullYear(), todayDate.getUTCMonth() + 1, 0),
  ).getUTCDate();

  return {
    today,
    weekStart,
    weekElapsedDays,
    monthStart,
    monthElapsedDays,
    daysInMonth,
  };
}

function parseUtcDate(dateString: string) {
  const [yearRaw, monthRaw, dayRaw] = dateString.split("-");
  return new Date(
    Date.UTC(Number(yearRaw), Number(monthRaw) - 1, Number(dayRaw)),
  );
}

function formatUtcDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function selectCurrentActiveScoreboard(
  scoreboards: Array<{
    id: number;
    userId: number;
    goalName: string;
    createdAt: Date | number | string;
  }>,
) {
  if (scoreboards.length === 0) {
    return undefined;
  }

  return scoreboards
    .slice()
    .sort(
      (a, b) => getCreatedAtMs(b.createdAt) - getCreatedAtMs(a.createdAt),
    )[0];
}

function getCreatedAtMs(createdAt: Date | number | string) {
  if (createdAt instanceof Date) {
    return createdAt.getTime();
  }

  if (typeof createdAt === "number") {
    return createdAt;
  }

  const parsed = Date.parse(createdAt);
  return Number.isNaN(parsed) ? 0 : parsed;
}
