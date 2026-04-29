import { getKstNowParts } from "@/domain/notification/services/notification-schedule";
import { getLocalizedDashboardPath } from "@/domain/notification/services/push-url";
import { NotificationStorage } from "@/domain/notification/storage/notification.storage";
import en from "@/messages/en.json";
import ko from "@/messages/ko.json";

type DevicePushTokenLookupPort = Pick<
  NotificationStorage,
  "findAllActiveDevicePushTokens" | "findUserNotificationSettingsByUserIds"
>;

const messages = { ko, en } as const;
type Locale = keyof typeof messages;

export type DailyReminderPushJob = {
  userId: number;
  token: string;
  title: string;
  body: string;
  url: `/${Locale}/dashboard/my`;
};

export class DailyReminderPushService {
  constructor(private notificationStorage: DevicePushTokenLookupPort) {}

  async buildDailyReminderJobs(input?: { now?: Date }) {
    const now = input?.now ?? new Date();
    const tokens = await this.notificationStorage.findAllActiveDevicePushTokens();
    const subscribedUserIds = [
      ...new Set(tokens.map((item) => Number(item.userId))),
    ].filter((userId) => Number.isInteger(userId));

    const settings =
      await this.notificationStorage.findUserNotificationSettingsByUserIds(
        subscribedUserIds,
      );

    const eligibleUserIds = new Set<number>();
    const timezoneHours = new Map<string, number>();

    for (const setting of settings) {
      if (!setting.dailyReminderEnabled) continue;

      const tz = setting.timezone || "Asia/Seoul";
      let currentHour = timezoneHours.get(tz);

      if (currentHour === undefined) {
        try {
          const parts = new Intl.DateTimeFormat("en-US", {
            hour: "numeric",
            hour12: false,
            timeZone: tz,
          }).formatToParts(now);
          const hourPart = parts.find((p) => p.type === "hour");
          currentHour = hourPart ? parseInt(hourPart.value, 10) % 24 : -1;
          timezoneHours.set(tz, currentHour);
        } catch {
          // Fallback if timezone is invalid
          currentHour = getKstNowParts(now).hour;
          timezoneHours.set(tz, currentHour);
        }
      }

      if (setting.dailyReminderHour === currentHour) {
        eligibleUserIds.add(setting.userId);
      }
    }

    if (eligibleUserIds.size === 0) {
      return {
        jobs: [] as DailyReminderPushJob[],
        summary: {
          totalDevices: tokens.length,
          eligibleUsers: 0,
          totalJobs: 0,
        },
      };
    }

    const tokensByUserId = tokens.reduce<
      Map<number, typeof tokens>
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

    const localeMap = new Map<number, Locale>(
      settings.map((s) => [s.userId, (s.user?.locale as Locale) ?? "ko"]),
    );

    const jobs: DailyReminderPushJob[] = [];

    for (const userId of eligibleUserIds) {
      const subscriptionsForUser = tokensByUserId.get(userId) ?? [];
      const userLocale = localeMap.get(userId) ?? "ko";
      const t = messages[userLocale] ?? messages.ko;

      for (const subscription of subscriptionsForUser) {
        jobs.push({
          userId,
          token: subscription.token,
          title: t.Notification.dailyReminderTitle,
          body: t.Notification.dailyReminderBody,
          url: getLocalizedDashboardPath(userLocale),
        });
      }
    }

    return {
      jobs,
      summary: {
        totalDevices: tokens.length,
        eligibleUsers: eligibleUserIds.size,
        totalJobs: jobs.length,
      },
    };
  }
}
