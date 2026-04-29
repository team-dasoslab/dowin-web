import { DailyReminderPushService } from "@/domain/notification/services/daily-reminder-push.service";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("DailyReminderPushService", () => {
  const findAllActiveDevicePushTokens = vi.fn();
  const findUserNotificationSettingsByUserIds = vi.fn();

  const createService = () =>
    new DailyReminderPushService({
      findAllActiveDevicePushTokens,
      findUserNotificationSettingsByUserIds,
    });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("현재 KST 시각과 설정 시간이 맞으면 발송 작업을 만든다 (다국어 지원)", async () => {
    findAllActiveDevicePushTokens.mockResolvedValue([
      {
        userId: 1,
        token: "token-1",
      },
      {
        userId: 2,
        token: "token-2",
      },
    ]);
    findUserNotificationSettingsByUserIds.mockResolvedValue([
      {
        userId: 1,
        dailyReminderEnabled: true,
        dailyReminderHour: 21,
        dailyReminderMinute: 0,
        timezone: "Asia/Seoul",
        user: { locale: "ko" },
      },
      {
        userId: 2,
        dailyReminderEnabled: true,
        dailyReminderHour: 12, // 12:00 in UTC (which is 21:00 KST)
        timezone: "UTC",
        user: { locale: "en" },
      },
    ]);

    const result = await createService().buildDailyReminderJobs({
      now: new Date("2026-04-14T12:00:00.000Z"), // 21:00 KST, 12:00 UTC
    });

    expect(result.jobs).toEqual([
      {
        userId: 1,
        token: "token-1",
        title: "리마인드",
        body: "오늘의 액션 아이템을 기록했나요? 지금 바로 체크해보세요!",
        url: "/ko/dashboard/my",
      },
      {
        userId: 2,
        token: "token-2",
        title: "Remind",
        body: "Did you record your lead measures today? Check them now!",
        url: "/en/dashboard/my",
      },
    ]);
    expect(result.summary).toMatchObject({
      totalDevices: 2,
      eligibleUsers: 2,
      totalJobs: 2,
    });
  });
});
