import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCloudflareContext = vi.fn();
const mockGetDb = vi.fn();
const mockGetSessionWithRefresh = vi.fn();
const mockFindDevicePushToken = vi.fn();

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: mockGetCloudflareContext,
}));

vi.mock("@/db", () => ({
  getDb: mockGetDb,
}));

vi.mock("@/lib/server/auth", () => ({
  getSessionWithRefresh: mockGetSessionWithRefresh,
}));

describe("POST /api/notifications/devices/status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCloudflareContext.mockReturnValue({ env: { DB: {} } });
    mockFindDevicePushToken.mockResolvedValue(null);
    mockGetDb.mockReturnValue({
      query: {
        devicePushTokens: {
          findFirst: mockFindDevicePushToken,
        },
      },
    });
  });

  it("세션이 없으면 401을 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue(null);

    const { POST } = await import("./route");
    const response = await POST(
      new NextRequest("http://localhost/api/notifications/devices/status", {
        method: "POST",
        body: JSON.stringify({ token: "token-1" }),
        headers: {
          "Content-Type": "application/json",
        },
      }) as never,
      { params: Promise.resolve({}) },
    );

    expect(response.status).toBe(401);
    expect(mockFindDevicePushToken).not.toHaveBeenCalled();
  });

  it("현재 사용자 토큰이 활성화되어 있으면 true를 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 7 });
    mockFindDevicePushToken.mockResolvedValue({
      userId: 7,
      token: "token-1",
      notificationEnabled: true,
      disabledAt: null,
    });

    const { POST } = await import("./route");
    const response = await POST(
      new NextRequest("http://localhost/api/notifications/devices/status", {
        method: "POST",
        body: JSON.stringify({ token: "token-1" }),
        headers: {
          "Content-Type": "application/json",
        },
      }) as never,
      { params: Promise.resolve({}) },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      notificationEnabled: true,
    });
  });

  it("토큰이 없거나 비활성화되어 있으면 false를 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 7 });
    mockFindDevicePushToken.mockResolvedValue({
      userId: 7,
      token: "token-1",
      notificationEnabled: false,
      disabledAt: new Date(),
    });

    const { POST } = await import("./route");
    const response = await POST(
      new NextRequest("http://localhost/api/notifications/devices/status", {
        method: "POST",
        body: JSON.stringify({ token: "token-1" }),
        headers: {
          "Content-Type": "application/json",
        },
      }) as never,
      { params: Promise.resolve({}) },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      notificationEnabled: false,
    });
  });
});
