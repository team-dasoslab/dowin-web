import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCloudflareContext = vi.fn();
const mockGetDb = vi.fn();
const mockGetSessionWithRefresh = vi.fn();
const mockGuardRestrictedTestAccountWrite = vi.fn();
const mockInsertValues = vi.fn();
const mockOnConflictDoUpdate = vi.fn();
const mockUpdateSet = vi.fn();
const mockUpdateWhere = vi.fn();
const mockFindUserNotificationSettings = vi.fn();
const mockReturning = vi.fn();

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

describe("POST /api/notifications/devices", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCloudflareContext.mockReturnValue({ env: { DB: {} } });
    mockGuardRestrictedTestAccountWrite.mockResolvedValue(null);
    mockFindUserNotificationSettings.mockResolvedValue(null);
    mockReturning.mockResolvedValue([
      {
        userId: 7,
        dailyReminderEnabled: true,
        dailyReminderHour: 21,
        dailyReminderMinute: 0,
        timezone: "Asia/Seoul",
      },
    ]);
    mockOnConflictDoUpdate.mockImplementation(() => ({
      returning: mockReturning,
    }));
    mockInsertValues.mockReturnValue({
      onConflictDoUpdate: mockOnConflictDoUpdate,
      returning: mockReturning,
    });
    mockUpdateSet.mockReturnValue({
      where: mockUpdateWhere,
    });
    mockUpdateWhere.mockResolvedValue(undefined);
    mockGetDb.mockReturnValue({
      insert: vi.fn(() => ({
        values: mockInsertValues,
      })),
      update: vi.fn(() => ({
        set: mockUpdateSet,
      })),
      query: {
        userNotificationSettings: {
          findFirst: mockFindUserNotificationSettings,
        },
      },
    });
  });

  it("세션이 없으면 401을 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue(null);

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/notifications/devices", {
        method: "POST",
        body: JSON.stringify({
          provider: "FCM",
          platform: "IOS",
          token: "token-1",
          notificationEnabled: true,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }) as never,
    );

    expect(response.status).toBe(401);
    expect(mockInsertValues).not.toHaveBeenCalled();
  });

  it("세션 사용자 기준으로 디바이스 토큰을 upsert한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 7 });

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/notifications/devices", {
        method: "POST",
        body: JSON.stringify({
          provider: "FCM",
          platform: "IOS",
          token: "token-1",
          appVersion: "1.2.3",
          notificationEnabled: true,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }) as never,
    );

    expect(response.status).toBe(200);
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 7,
        provider: "FCM",
        platform: "IOS",
        token: "token-1",
        appVersion: "1.2.3",
        notificationEnabled: true,
      }),
    );
    expect(mockFindUserNotificationSettings).toHaveBeenCalled();
  });
});

describe("DELETE /api/notifications/devices", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCloudflareContext.mockReturnValue({ env: { DB: {} } });
    mockGuardRestrictedTestAccountWrite.mockResolvedValue(null);
    mockUpdateSet.mockReturnValue({
      where: mockUpdateWhere,
    });
    mockUpdateWhere.mockResolvedValue(undefined);
    mockGetDb.mockReturnValue({
      update: vi.fn(() => ({
        set: mockUpdateSet,
      })),
    });
  });

  it("세션이 없으면 401을 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue(null);

    const { DELETE } = await import("./route");
    const response = await DELETE(
      new Request("http://localhost/api/notifications/devices", {
        method: "DELETE",
        body: JSON.stringify({
          token: "token-1",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }) as never,
    );

    expect(response.status).toBe(401);
    expect(mockUpdateSet).not.toHaveBeenCalled();
  });

  it("현재 사용자 토큰을 비활성화한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 7 });

    const { DELETE } = await import("./route");
    const response = await DELETE(
      new Request("http://localhost/api/notifications/devices", {
        method: "DELETE",
        body: JSON.stringify({
          token: "token-1",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }) as never,
    );

    expect(response.status).toBe(200);
    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        notificationEnabled: false,
      }),
    );
    expect(mockUpdateWhere).toHaveBeenCalled();
  });
});
