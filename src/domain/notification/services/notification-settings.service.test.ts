import { NotificationSettingsService } from "@/domain/notification/services/notification-settings.service";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("NotificationSettingsService", () => {
  const findUserNotificationSettings = vi.fn();
  const upsertUserNotificationSettings = vi.fn();

  const createService = () =>
    new NotificationSettingsService(
      {
        findUserNotificationSettings,
        upsertUserNotificationSettings,
      },
      {},
    );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("리마인드 시간 변경 시 기존 timezone을 보존한다", async () => {
    findUserNotificationSettings.mockResolvedValue({
      userId: 1,
      dailyReminderEnabled: true,
      dailyReminderHour: 9,
      dailyReminderMinute: 0,
      timezone: "America/Los_Angeles",
    });
    upsertUserNotificationSettings.mockResolvedValue({
      userId: 1,
      dailyReminderEnabled: true,
      dailyReminderHour: 21,
      dailyReminderMinute: 0,
      timezone: "America/Los_Angeles",
    });

    const result = await createService().updateMySettings(1, {
      dailyReminderEnabled: true,
      dailyReminderHour: 21,
      dailyReminderMinute: 0,
    });

    expect(upsertUserNotificationSettings).toHaveBeenCalledWith({
      userId: 1,
      dailyReminderEnabled: true,
      dailyReminderHour: 21,
      dailyReminderMinute: 0,
      timezone: "America/Los_Angeles",
    });
    expect(result).toEqual({
      dailyReminderEnabled: true,
      dailyReminderTime: "21:00",
      timezone: "America/Los_Angeles",
    });
  });

  it("timezone 동기화 시 리마인드 설정은 유지하고 timezone만 변경한다", async () => {
    findUserNotificationSettings.mockResolvedValue({
      userId: 1,
      dailyReminderEnabled: true,
      dailyReminderHour: 8,
      dailyReminderMinute: 0,
      timezone: "Asia/Seoul",
    });
    upsertUserNotificationSettings.mockResolvedValue({
      userId: 1,
      dailyReminderEnabled: true,
      dailyReminderHour: 8,
      dailyReminderMinute: 0,
      timezone: "America/Los_Angeles",
    });

    const result = await createService().updateMyTimezone(
      1,
      "America/Los_Angeles",
    );

    expect(upsertUserNotificationSettings).toHaveBeenCalledWith({
      userId: 1,
      dailyReminderEnabled: true,
      dailyReminderHour: 8,
      dailyReminderMinute: 0,
      timezone: "America/Los_Angeles",
    });
    expect(result).toEqual({
      dailyReminderEnabled: true,
      dailyReminderTime: "08:00",
      timezone: "America/Los_Angeles",
    });
  });

  it("동일 timezone이면 DB 갱신 없이 현재 설정을 반환한다", async () => {
    findUserNotificationSettings.mockResolvedValue({
      userId: 1,
      dailyReminderEnabled: true,
      dailyReminderHour: 8,
      dailyReminderMinute: 30,
      timezone: "Asia/Seoul",
    });

    const result = await createService().updateMyTimezone(1, "Asia/Seoul");

    expect(upsertUserNotificationSettings).not.toHaveBeenCalled();
    expect(result).toEqual({
      dailyReminderEnabled: true,
      dailyReminderTime: "08:30",
      timezone: "Asia/Seoul",
    });
  });

  it("timezone 동기화가 설정을 처음 만들 때 기존 첫 등록 기본값을 사용한다", async () => {
    findUserNotificationSettings.mockResolvedValue(null);
    upsertUserNotificationSettings.mockResolvedValue({
      userId: 1,
      dailyReminderEnabled: true,
      dailyReminderHour: 21,
      dailyReminderMinute: 0,
      timezone: "America/Los_Angeles",
    });

    const result = await createService().updateMyTimezone(
      1,
      "America/Los_Angeles",
    );

    expect(upsertUserNotificationSettings).toHaveBeenCalledWith({
      userId: 1,
      dailyReminderEnabled: true,
      dailyReminderHour: 21,
      dailyReminderMinute: 0,
      timezone: "America/Los_Angeles",
    });
    expect(result).toEqual({
      dailyReminderEnabled: true,
      dailyReminderTime: "21:00",
      timezone: "America/Los_Angeles",
    });
  });
});
