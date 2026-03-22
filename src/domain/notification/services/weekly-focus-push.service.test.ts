import { beforeEach, describe, expect, it, vi } from "vitest";
import { WeeklyFocusPushService } from "@/domain/notification/services/weekly-focus-push.service";

describe("WeeklyFocusPushService", () => {
  const now = new Date("2026-03-19T06:00:00.000Z");

  const findAllPushSubscriptions = vi.fn();
  const findActiveScoreboardsForPush = vi.fn();
  const findActiveLeadMeasuresByScoreboardIds = vi.fn();
  const countTrueLogsForLeadMeasuresInRange = vi.fn();
  const breakWeeklyFocusTie = vi.fn();

  const createService = () =>
    new WeeklyFocusPushService(
      {
        findAllPushSubscriptions,
      },
      {
        findActiveScoreboardsForPush,
      },
      {
        findActiveLeadMeasuresByScoreboardIds,
      },
      {
        countTrueLogsForLeadMeasuresInRange,
      },
      {
        breakWeeklyFocusTie,
      },
    );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("skips users with no active scoreboard", async () => {
    findAllPushSubscriptions.mockResolvedValue([
      {
        userId: "1",
        endpoint: "https://push.example.com/1",
        p256dh: "p256dh-1",
        auth: "auth-1",
      },
    ]);
    findActiveScoreboardsForPush.mockResolvedValue([]);
    findActiveLeadMeasuresByScoreboardIds.mockResolvedValue([]);
    countTrueLogsForLeadMeasuresInRange.mockResolvedValue({});

    const result = await createService().buildWeeklyFocusJobs({ now });

    expect(result.jobs).toEqual([]);
    expect(result.summary).toMatchObject({
      totalSubscriptions: 1,
      totalJobs: 0,
      skippedNoActiveScoreboard: 1,
      skippedNoEligibleLeadMeasures: 0,
      aiTieBreaks: 0,
    });
    expect(findActiveLeadMeasuresByScoreboardIds).not.toHaveBeenCalled();
    expect(countTrueLogsForLeadMeasuresInRange).not.toHaveBeenCalled();
    expect(breakWeeklyFocusTie).not.toHaveBeenCalled();
  });

  it("sends direct selection without AI when one lowest candidate exists", async () => {
    findAllPushSubscriptions.mockResolvedValue([
      {
        userId: "1",
        endpoint: "https://push.example.com/1",
        p256dh: "p256dh-1",
        auth: "auth-1",
      },
    ]);
    findActiveScoreboardsForPush.mockResolvedValue([
      {
        id: 10,
        userId: 1,
        goalName: "흔들리지 않고 실행하기",
        createdAt: new Date("2026-03-10T00:00:00.000Z"),
      },
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
        id: 102,
        scoreboardId: 10,
        name: "주 3회 운동",
        targetValue: 3,
        period: "WEEKLY",
      },
    ]);
    countTrueLogsForLeadMeasuresInRange.mockResolvedValue({
      101: 1,
      102: 2,
    });

    const result = await createService().buildWeeklyFocusJobs({ now });

    expect(result.jobs).toEqual([
      {
        userId: 1,
        scoreboardId: 10,
        leadMeasureId: 101,
        endpoint: "https://push.example.com/1",
        p256dh: "p256dh-1",
        auth: "auth-1",
        title: "리마인드",
        body: "오늘은 매일 물 2L 해볼까요?",
        url: "/dashboard/my",
      },
    ]);
    expect(result.summary).toMatchObject({
      totalSubscriptions: 1,
      totalJobs: 1,
      aiTieBreaks: 0,
    });
    expect(countTrueLogsForLeadMeasuresInRange).toHaveBeenCalledWith(
      [101, 102],
      "2026-03-16",
      "2026-03-19",
    );
    expect(breakWeeklyFocusTie).not.toHaveBeenCalled();
  });

  it("supports monthly measures using month-to-date progress", async () => {
    findAllPushSubscriptions.mockResolvedValue([
      {
        userId: "1",
        endpoint: "https://push.example.com/1",
        p256dh: "p256dh-1",
        auth: "auth-1",
      },
    ]);
    findActiveScoreboardsForPush.mockResolvedValue([
      {
        id: 10,
        userId: 1,
        goalName: "흔들리지 않고 실행하기",
        createdAt: new Date("2026-03-10T00:00:00.000Z"),
      },
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
        id: 103,
        scoreboardId: 10,
        name: "월 10회 회고",
        targetValue: 10,
        period: "MONTHLY",
      },
    ]);
    countTrueLogsForLeadMeasuresInRange
      .mockResolvedValueOnce({
        101: 1,
      })
      .mockResolvedValueOnce({
        103: 1,
      });

    const result = await createService().buildWeeklyFocusJobs({ now });

    expect(result.jobs).toEqual([
      expect.objectContaining({
        leadMeasureId: 103,
        title: "리마인드",
        body: "오늘은 월 10회 회고 해볼까요?",
      }),
    ]);
    expect(countTrueLogsForLeadMeasuresInRange).toHaveBeenNthCalledWith(
      1,
      [101],
      "2026-03-16",
      "2026-03-19",
    );
    expect(countTrueLogsForLeadMeasuresInRange).toHaveBeenNthCalledWith(
      2,
      [103],
      "2026-03-01",
      "2026-03-19",
    );
    expect(breakWeeklyFocusTie).not.toHaveBeenCalled();
  });

  it("uses AI only when lowest candidates tie", async () => {
    findAllPushSubscriptions.mockResolvedValue([
      {
        userId: "1",
        endpoint: "https://push.example.com/1",
        p256dh: "p256dh-1",
        auth: "auth-1",
      },
      {
        userId: "1",
        endpoint: "https://push.example.com/2",
        p256dh: "p256dh-2",
        auth: "auth-2",
      },
    ]);
    findActiveScoreboardsForPush.mockResolvedValue([
      {
        id: 10,
        userId: 1,
        goalName: "흔들리지 않고 실행하기",
        createdAt: new Date("2026-03-10T00:00:00.000Z"),
      },
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
        id: 102,
        scoreboardId: 10,
        name: "주 3회 운동",
        targetValue: 7,
        period: "DAILY",
      },
      {
        id: 103,
        scoreboardId: 10,
        name: "독서",
        targetValue: 7,
        period: "DAILY",
      },
    ]);
    countTrueLogsForLeadMeasuresInRange.mockResolvedValue({
      101: 1,
      102: 1,
      103: 2,
    });
    breakWeeklyFocusTie.mockResolvedValue(102);

    const result = await createService().buildWeeklyFocusJobs({
      now,
      googleApiKey: "test-api-key",
    });

    expect(result.jobs).toEqual([
      expect.objectContaining({
        leadMeasureId: 102,
        endpoint: "https://push.example.com/1",
        p256dh: "p256dh-1",
        auth: "auth-1",
        body: "오늘은 주 3회 운동 해볼까요?",
      }),
      expect.objectContaining({
        leadMeasureId: 102,
        endpoint: "https://push.example.com/2",
        p256dh: "p256dh-2",
        auth: "auth-2",
        body: "오늘은 주 3회 운동 해볼까요?",
      }),
    ]);
    expect(result.summary).toMatchObject({
      totalJobs: 2,
      aiTieBreaks: 1,
    });
    expect(breakWeeklyFocusTie).toHaveBeenCalledWith(
      {
        goalName: "흔들리지 않고 실행하기",
        candidates: [
          expect.objectContaining({ id: 101 }),
          expect.objectContaining({ id: 102 }),
        ],
      },
      expect.objectContaining({
        apiKey: "test-api-key",
      }),
    );
  });

  it("skips push when candidate count is zero", async () => {
    findAllPushSubscriptions.mockResolvedValue([
      {
        userId: "1",
        endpoint: "https://push.example.com/1",
        p256dh: "p256dh-1",
        auth: "auth-1",
      },
    ]);
    findActiveScoreboardsForPush.mockResolvedValue([
      {
        id: 10,
        userId: 1,
        goalName: "흔들리지 않고 실행하기",
        createdAt: new Date("2026-03-10T00:00:00.000Z"),
      },
    ]);
    findActiveLeadMeasuresByScoreboardIds.mockResolvedValue([]);
    countTrueLogsForLeadMeasuresInRange.mockResolvedValue({});

    const result = await createService().buildWeeklyFocusJobs({ now });

    expect(result.jobs).toEqual([]);
    expect(result.summary).toMatchObject({
      totalSubscriptions: 1,
      totalJobs: 0,
      skippedNoActiveScoreboard: 0,
      skippedNoEligibleLeadMeasures: 1,
      aiTieBreaks: 0,
    });
    expect(breakWeeklyFocusTie).not.toHaveBeenCalled();
  });

  it("uses the most recent active scoreboard when multiple active scoreboards exist", async () => {
    findAllPushSubscriptions.mockResolvedValue([
      {
        userId: "1",
        endpoint: "https://push.example.com/1",
        p256dh: "p256dh-1",
        auth: "auth-1",
      },
    ]);
    findActiveScoreboardsForPush.mockResolvedValue([
      {
        id: 10,
        userId: 1,
        goalName: "이전 점수판",
        createdAt: new Date("2026-03-01T00:00:00.000Z"),
      },
      {
        id: 11,
        userId: 1,
        goalName: "현재 점수판",
        createdAt: new Date("2026-03-15T00:00:00.000Z"),
      },
    ]);
    findActiveLeadMeasuresByScoreboardIds.mockResolvedValue([
      {
        id: 101,
        scoreboardId: 10,
        name: "이전 선행지표",
        targetValue: 7,
        period: "DAILY",
      },
      {
        id: 201,
        scoreboardId: 11,
        name: "현재 선행지표",
        targetValue: 7,
        period: "DAILY",
      },
    ]);
    countTrueLogsForLeadMeasuresInRange.mockResolvedValue({
      101: 0,
      201: 0,
    });

    const result = await createService().buildWeeklyFocusJobs({ now });

    expect(result.jobs).toEqual([
      expect.objectContaining({
        scoreboardId: 11,
        leadMeasureId: 201,
        body: "오늘은 현재 선행지표 해볼까요?",
      }),
    ]);
  });
});
