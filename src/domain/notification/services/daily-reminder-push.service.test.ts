import { beforeEach, describe, expect, it, vi } from "vitest";
import { DailyReminderPushService } from "@/domain/notification/services/daily-reminder-push.service";

describe("DailyReminderPushService", () => {
  const findAllPushSubscriptions = vi.fn();
  const findUserNotificationSettingsByUserIds = vi.fn();
  const findActiveScoreboardsForPush = vi.fn();
  const findActiveLeadMeasuresByScoreboardIds = vi.fn();
  const findLogsForLeadMeasures = vi.fn();

  const createService = () =>
    new DailyReminderPushService(
      {
        findAllPushSubscriptions,
        findUserNotificationSettingsByUserIds,
      },
      {
        findActiveScoreboardsForPush,
      },
      {
        findActiveLeadMeasuresByScoreboardIds,
      },
      {
        findLogsForLeadMeasures,
      },
    );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("현재 KST 시각과 설정 시간이 맞고 미기록 지표가 남아있으면 발송 작업을 만든다", async () => {
    findAllPushSubscriptions.mockResolvedValue([
      {
        userId: "1",
        endpoint: "https://push.example.com/1",
        p256dh: "p256dh-1",
        auth: "auth-1",
      },
      {
        userId: "2",
        endpoint: "https://push.example.com/2",
        p256dh: "p256dh-2",
        auth: "auth-2",
      },
    ]);
    findUserNotificationSettingsByUserIds.mockResolvedValue([
      {
        userId: 1,
        dailyReminderEnabled: true,
        dailyReminderHour: 21,
        dailyReminderMinute: 0,
        timezone: "Asia/Seoul",
      },
      {
        userId: 2,
        dailyReminderEnabled: true,
        dailyReminderHour: 21,
        dailyReminderMinute: 0,
        timezone: "Asia/Seoul",
      },
    ]);
    findActiveScoreboardsForPush.mockResolvedValue([
      { id: 10, userId: 1, goalName: "집중", createdAt: new Date() },
      { id: 20, userId: 2, goalName: "완료", createdAt: new Date() },
    ]);
    findActiveLeadMeasuresByScoreboardIds.mockResolvedValue([
      {
        id: 101,
        scoreboardId: 10,
        name: "매일 물 2L",
        targetValue: 7,
        period: "DAILY",
      },
      {
        id: 201,
        scoreboardId: 20,
        name: "독서 20분",
        targetValue: 7,
        period: "DAILY",
      },
    ]);
    findLogsForLeadMeasures.mockResolvedValue([
      {
        leadMeasureId: 201,
        logDate: "2026-04-14",
        value: true,
      },
    ]);

    const result = await createService().buildDailyReminderJobs({
      now: new Date("2026-04-14T12:00:00.000Z"),
    });

    expect(result.jobs).toEqual([
      {
        endpoint: "https://push.example.com/1",
        p256dh: "p256dh-1",
        auth: "auth-1",
        title: "오늘 기록이 남아있어요",
        body: "매일 물 2L 기록이 아직 남아 있어요.",
        url: "/dashboard/my",
      },
    ]);
    expect(result.summary).toMatchObject({
      totalSubscriptions: 2,
      eligibleUsers: 2,
      totalJobs: 1,
      skippedCompletedToday: 1,
    });
  });
});
