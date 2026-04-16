import { DailyLogStorage } from "@/domain/daily-log/storage/daily-log.storage";
import { LeadMeasureStorage } from "@/domain/lead-measure/storage/lead-measure.storage";
import { getKstNowParts } from "@/domain/notification/services/notification-schedule";
import { NotificationStorage } from "@/domain/notification/storage/notification.storage";
import { ScoreboardStorage } from "@/domain/scoreboard/storage/scoreboard.storage";

type PushSubscriptionLookupPort = Pick<
  NotificationStorage,
  "findAllPushSubscriptions" | "findUserNotificationSettingsByUserIds"
>;

type ScoreboardLookupPort = Pick<
  ScoreboardStorage,
  "findActiveScoreboardsForPush"
>;
type LeadMeasureLookupPort = Pick<
  LeadMeasureStorage,
  "findActiveLeadMeasuresByScoreboardIds"
>;
type DailyLogLookupPort = Pick<DailyLogStorage, "findLogsForLeadMeasures">;

export type DailyReminderPushJob = {
  endpoint: string;
  p256dh: string;
  auth: string;
  title: string;
  body: string;
  url: "/dashboard/my";
};

export class DailyReminderPushService {
  constructor(
    private notificationStorage: PushSubscriptionLookupPort,
    private scoreboardStorage: ScoreboardLookupPort,
    private leadMeasureStorage: LeadMeasureLookupPort,
    private dailyLogStorage: DailyLogLookupPort,
  ) {}

  async buildDailyReminderJobs(input?: { now?: Date }) {
    const now = input?.now ?? new Date();
    const subscriptions =
      await this.notificationStorage.findAllPushSubscriptions();
    const subscribedUserIds = [
      ...new Set(subscriptions.map((item) => Number(item.userId))),
    ].filter((userId) => Number.isInteger(userId));
    const settings =
      await this.notificationStorage.findUserNotificationSettingsByUserIds(
        subscribedUserIds,
      );
    const kstNow = getKstNowParts(now);
    const eligibleUserIds = new Set(
      settings
        .filter(
          (setting) =>
            setting.dailyReminderEnabled &&
            setting.timezone === "Asia/Seoul" &&
            setting.dailyReminderHour === kstNow.hour,
        )
        .map((setting) => setting.userId),
    );

    if (eligibleUserIds.size === 0) {
      return {
        jobs: [] as DailyReminderPushJob[],
        summary: {
          totalSubscriptions: subscriptions.length,
          eligibleUsers: 0,
          totalJobs: 0,
          skippedNoActiveScoreboard: 0,
          skippedCompletedToday: 0,
        },
      };
    }

    const scoreboards =
      await this.scoreboardStorage.findActiveScoreboardsForPush();
    const eligibleScoreboards = scoreboards.filter((scoreboard) =>
      eligibleUserIds.has(scoreboard.userId),
    );
    const leadMeasures =
      await this.leadMeasureStorage.findActiveLeadMeasuresByScoreboardIds(
        eligibleScoreboards.map((scoreboard) => scoreboard.id),
      );
    const logs = await this.dailyLogStorage.findLogsForLeadMeasures(
      leadMeasures.map((leadMeasure) => leadMeasure.id),
      kstNow.dateKey,
      kstNow.dateKey,
    );
    const loggedLeadMeasureIds = new Set(logs.map((log) => log.leadMeasureId));
    const subscriptionsByUserId = subscriptions.reduce<
      Map<number, typeof subscriptions>
    >((map, subscription) => {
      const userId = Number(subscription.userId);
      if (!Number.isInteger(userId)) {
        return map;
      }

      const existing = map.get(userId) ?? [];
      existing.push(subscription);
      map.set(userId, existing);
      return map;
    }, new Map());
    const leadMeasuresByScoreboardId = leadMeasures.reduce<
      Map<number, typeof leadMeasures>
    >((map, leadMeasure) => {
      const existing = map.get(leadMeasure.scoreboardId) ?? [];
      existing.push(leadMeasure);
      map.set(leadMeasure.scoreboardId, existing);
      return map;
    }, new Map());

    const jobs: DailyReminderPushJob[] = [];
    let skippedNoActiveScoreboard = 0;
    let skippedCompletedToday = 0;

    for (const userId of eligibleUserIds) {
      const scoreboard = eligibleScoreboards.find(
        (item) => item.userId === userId,
      );
      if (!scoreboard) {
        skippedNoActiveScoreboard += 1;
        continue;
      }

      const scoreboardLeadMeasures =
        leadMeasuresByScoreboardId.get(scoreboard.id) ?? [];
      const remainingLeadMeasures = scoreboardLeadMeasures.filter(
        (leadMeasure) => !loggedLeadMeasureIds.has(leadMeasure.id),
      );

      if (remainingLeadMeasures.length === 0) {
        skippedCompletedToday += 1;
        continue;
      }

      const subscriptionsForUser = subscriptionsByUserId.get(userId) ?? [];
      const firstLeadMeasureName = remainingLeadMeasures[0]?.name ?? "선행지표";
      const body =
        remainingLeadMeasures.length === 1
          ? `${firstLeadMeasureName} 기록이 아직 남아 있어요.`
          : `${firstLeadMeasureName} 외 ${remainingLeadMeasures.length - 1}개 지표 기록이 남아 있어요.`;

      for (const subscription of subscriptionsForUser) {
        jobs.push({
          endpoint: subscription.endpoint,
          p256dh: subscription.p256dh,
          auth: subscription.auth,
          title: "오늘 기록이 남아있어요",
          body,
          url: "/dashboard/my",
        });
      }
    }

    return {
      jobs,
      summary: {
        totalSubscriptions: subscriptions.length,
        eligibleUsers: eligibleUserIds.size,
        totalJobs: jobs.length,
        skippedNoActiveScoreboard,
        skippedCompletedToday,
      },
    };
  }
}
