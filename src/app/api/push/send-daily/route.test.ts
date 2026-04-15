import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCloudflareContext = vi.fn();
const mockRunDailyReminder = vi.fn();

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: mockGetCloudflareContext,
}));

vi.mock("@/domain/notification/services/run-daily-reminder", () => ({
  runDailyReminder: mockRunDailyReminder,
}));

describe("GET /api/push/send-daily", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCloudflareContext.mockReturnValue({
      env: {
        CRON_SECRET: "cron-secret",
      },
    });
  });

  it("Authorization이 맞지 않으면 401을 반환한다", async () => {
    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost/api/push/send-daily", {
        headers: {
          Authorization: "Bearer wrong-secret",
        },
      }) as never,
    );

    expect(response.status).toBe(401);
    expect(mockRunDailyReminder).not.toHaveBeenCalled();
  });

  it("인증되면 공통 실행 결과를 반환한다", async () => {
    mockRunDailyReminder.mockResolvedValue({
      totalSubscriptions: 2,
      dueUsers: 1,
      skippedNoActiveScoreboard: 0,
      skippedAlreadyCompletedToday: 1,
      totalJobs: 1,
      success: 1,
      failed: 0,
    });

    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost/api/push/send-daily", {
        headers: {
          Authorization: "Bearer cron-secret",
        },
      }) as never,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      totalSubscriptions: 2,
      dueUsers: 1,
      skippedNoActiveScoreboard: 0,
      skippedAlreadyCompletedToday: 1,
      totalJobs: 1,
      success: 1,
      failed: 0,
    });
    expect(mockRunDailyReminder).toHaveBeenCalledWith({
      CRON_SECRET: "cron-secret",
    });
  });
});
