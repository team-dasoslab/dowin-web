import { getKstNowParts } from "@/domain/notification/services/notification-schedule";
import { NotificationStorage } from "@/domain/notification/storage/notification.storage";

type PushSubscriptionLookupPort = Pick<
  NotificationStorage,
  "findAllPushSubscriptions" | "findUserNotificationSettingsByUserIds"
>;

export type DailyReminderPushJob = {
  endpoint: string;
  p256dh: string;
  auth: string;
  title: string;
  body: string;
  url: "/dashboard/my";
};

export class DailyReminderPushService {
  constructor(private notificationStorage: PushSubscriptionLookupPort) {}

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
        },
      };
    }

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

    const jobs: DailyReminderPushJob[] = [];
    const body = "오늘의 선행지표를 기록했나요? 지금 바로 체크해보세요!";

    for (const userId of eligibleUserIds) {
      const subscriptionsForUser = subscriptionsByUserId.get(userId) ?? [];

      for (const subscription of subscriptionsForUser) {
        jobs.push({
          endpoint: subscription.endpoint,
          p256dh: subscription.p256dh,
          auth: subscription.auth,
          title: "리마인드",
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
      },
    };
  }
}
