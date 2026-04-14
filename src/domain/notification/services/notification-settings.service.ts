import { NotificationStorage } from "@/domain/notification/storage/notification.storage";
import { formatHourMinute } from "@/domain/notification/services/notification-schedule";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";

type NotificationStoragePort = Pick<
  NotificationStorage,
  "findUserNotificationSettings" | "upsertUserNotificationSettings"
>;

type WorkspaceStoragePort = Pick<WorkspaceStorage, never>;

const DEFAULT_TIMEZONE = "Asia/Seoul";

export class NotificationSettingsService {
  constructor(
    private notificationStorage: NotificationStoragePort,
    private _workspaceStorage: WorkspaceStoragePort,
  ) {}

  async getMySettings(userId: number) {
    const settings =
      await this.notificationStorage.findUserNotificationSettings(userId);

    return {
      dailyReminderEnabled: settings?.dailyReminderEnabled ?? false,
      dailyReminderTime: formatHourMinute(
        settings?.dailyReminderHour ?? 21,
        settings?.dailyReminderMinute ?? 0,
      ),
      timezone: settings?.timezone ?? DEFAULT_TIMEZONE,
    };
  }

  async updateMySettings(
    userId: number,
    input: {
      dailyReminderEnabled: boolean;
      dailyReminderHour: number;
      dailyReminderMinute: number;
    },
  ) {
    const settings = await this.notificationStorage.upsertUserNotificationSettings({
      userId,
      dailyReminderEnabled: input.dailyReminderEnabled,
      dailyReminderHour: input.dailyReminderHour,
      dailyReminderMinute: input.dailyReminderMinute,
      timezone: DEFAULT_TIMEZONE,
    });

    return {
      dailyReminderEnabled: settings.dailyReminderEnabled,
      dailyReminderTime: formatHourMinute(
        settings.dailyReminderHour,
        settings.dailyReminderMinute,
      ),
      timezone: settings.timezone,
    };
  }
}
