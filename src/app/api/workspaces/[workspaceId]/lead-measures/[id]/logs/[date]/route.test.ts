import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForbiddenError } from "@/lib/server/errors";

const mockGetCloudflareContext = vi.fn();
const mockGetDb = vi.fn();
const mockGetSessionWithRefresh = vi.fn();
const mockGuardRestrictedTestAccountWrite = vi.fn();
const mockUpsertLog = vi.fn();

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: mockGetCloudflareContext,
}));

vi.mock("@/db", () => ({
  getDb: mockGetDb,
}));

vi.mock("@/lib/server/auth", () => ({
  getSessionWithRefresh: mockGetSessionWithRefresh,
}));

vi.mock("@/lib/server/restricted-test-account", () => ({
  guardRestrictedTestAccountWrite: mockGuardRestrictedTestAccountWrite,
}));

vi.mock("@/domain/daily-log/services/daily-log.service", () => ({
  DailyLogService: vi.fn(function MockDailyLogService() {
    return {
      upsertLog: mockUpsertLog,
    };
  }),
}));

vi.mock("@/domain/workspace/storage/workspace.storage", () => ({
  WorkspaceStorage: vi.fn(),
}));

vi.mock("@/domain/scoreboard/storage/scoreboard.storage", () => ({
  ScoreboardStorage: vi.fn(),
}));

vi.mock("@/domain/lead-measure/storage/lead-measure.storage", () => ({
  LeadMeasureStorage: vi.fn(),
}));

vi.mock("@/domain/daily-log/storage/daily-log.storage", () => ({
  DailyLogStorage: vi.fn(),
}));

describe("PUT /api/lead-measures/:id/logs/:date", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCloudflareContext.mockReturnValue({ env: { DB: {} } });
    mockGetDb.mockReturnValue({});
    mockGuardRestrictedTestAccountWrite.mockResolvedValue(null);
  });

  it("좌석 한도 초과 상태에서는 403을 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 1 });
    mockUpsertLog.mockRejectedValue(
      new ForbiddenError("WORKSPACE_SEAT_LIMIT_EXCEEDED"),
    );

    const { PUT } = await import("./route");
    const response = await PUT(
      new Request("http://localhost/api/lead-measures/10/logs/2026-04-21", {
        body: JSON.stringify({ value: true }),
        method: "PUT",
      }),
      { params: Promise.resolve({ workspaceId: "1", id: "10", date: "2026-04-21" }) },
    );
    const body = (await response.json()) as {
      error: { code: string };
    };

    expect(response.status).toBe(403);
    expect(body.error.code).toBe("WORKSPACE_SEAT_LIMIT_EXCEEDED");
    expect(mockUpsertLog).toHaveBeenCalledWith("1", 10, 1, "2026-04-21", {
      value: true,
    });
  });
});
