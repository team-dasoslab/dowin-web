import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCloudflareContext = vi.fn();
const mockGetDb = vi.fn();
const mockBuildPushPayload = vi.fn();
const mockBuildWeeklyFocusJobs = vi.fn();
const mockFetch = vi.fn();

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: mockGetCloudflareContext,
}));

vi.mock("@/db", () => ({
  getDb: mockGetDb,
}));

vi.mock("@block65/webcrypto-web-push", () => ({
  buildPushPayload: mockBuildPushPayload,
}));

vi.mock("@/domain/notification/services/weekly-focus-push.service", () => ({
  WeeklyFocusPushService: vi.fn(function MockWeeklyFocusPushService() {
    return {
      buildWeeklyFocusJobs: mockBuildWeeklyFocusJobs,
    };
  }),
}));

describe("GET /api/push/send-weekly-focus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCloudflareContext.mockReturnValue({
      env: {
        DB: {},
        CRON_SECRET: "cron-secret",
        NEXT_PUBLIC_VAPID_PUBLIC_KEY: "public-key",
        VAPID_PRIVATE_KEY: "private-key",
        GEMINI_API_KEY: "gemini-api-key",
      },
    });
    mockGetDb.mockReturnValue({
      select: vi.fn(() => ({
        from: vi.fn().mockResolvedValue([]),
      })),
      query: {
        scoreboards: {
          findMany: vi.fn(),
        },
        leadMeasures: {
          findMany: vi.fn(),
        },
        dailyLogs: {
          findMany: vi.fn(),
        },
      },
    });
    mockBuildPushPayload.mockResolvedValue({
      method: "POST",
      headers: { "Content-Type": "application/octet-stream" },
      body: new Uint8Array([1, 2, 3]),
    });
    mockFetch.mockResolvedValue(
      new Response(null, {
        status: 201,
      }),
    );
    vi.stubGlobal("fetch", mockFetch);
  });

  it("Authorization이 맞지 않으면 401을 반환한다", async () => {
    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost/api/push/send-weekly-focus", {
        headers: {
          Authorization: "Bearer wrong-secret",
        },
      }) as never,
    );

    expect(response.status).toBe(401);
    expect(mockBuildWeeklyFocusJobs).not.toHaveBeenCalled();
  });

  it("인증되면 서비스 결과를 기반으로 발송 요약을 반환한다", async () => {
    mockBuildWeeklyFocusJobs.mockResolvedValue({
      jobs: [
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
      ],
      summary: {
        totalSubscriptions: 1,
        totalJobs: 1,
        skippedNoActiveScoreboard: 0,
        skippedNoEligibleLeadMeasures: 0,
        aiTieBreaks: 0,
      },
    });

    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost/api/push/send-weekly-focus", {
        headers: {
          Authorization: "Bearer cron-secret",
        },
      }) as never,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      totalSubscriptions: 1,
      totalJobs: 1,
      skippedNoActiveScoreboard: 0,
      skippedNoEligibleLeadMeasures: 0,
      aiTieBreaks: 0,
      success: 1,
      failed: 0,
    });
    expect(mockBuildWeeklyFocusJobs).toHaveBeenCalledWith({
      googleApiKey: "gemini-api-key",
    });
    expect(mockBuildPushPayload).toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
