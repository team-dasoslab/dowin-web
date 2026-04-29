import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCloudflareContext = vi.fn();
const mockRunWeeklyFocusReminder = vi.fn();

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: mockGetCloudflareContext,
}));

vi.mock("@/domain/notification/services/run-weekly-focus-reminder", () => ({
  runWeeklyFocusReminder: mockRunWeeklyFocusReminder,
}));

describe("GET /api/push/send-weekly-focus", () => {
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
      new Request("http://localhost/api/push/send-weekly-focus", {
        headers: {
          Authorization: "Bearer wrong-secret",
        },
      }) as never,
    );

    expect(response.status).toBe(401);
    expect(mockRunWeeklyFocusReminder).not.toHaveBeenCalled();
  });

  it("인증되면 서비스 결과를 기반으로 발송 요약을 반환한다", async () => {
    mockRunWeeklyFocusReminder.mockResolvedValue({
      totalDevices: 1,
      totalJobs: 1,
      skippedNoActiveScoreboard: 0,
      skippedNoEligibleLeadMeasures: 0,
      aiTieBreaks: 0,
      success: 1,
      failed: 0,
      disabledTokens: 0,
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
      totalDevices: 1,
      totalJobs: 1,
      skippedNoActiveScoreboard: 0,
      skippedNoEligibleLeadMeasures: 0,
      aiTieBreaks: 0,
      success: 1,
      failed: 0,
      disabledTokens: 0,
    });
    expect(mockRunWeeklyFocusReminder).toHaveBeenCalledWith({
      CRON_SECRET: "cron-secret",
    });
  });
});
