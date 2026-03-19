import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCloudflareContext = vi.fn();
const mockGetDb = vi.fn();
const mockGetSession = vi.fn();
const mockInsertValues = vi.fn();
const mockOnConflictDoUpdate = vi.fn();
const mockDeleteWhere = vi.fn();

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: mockGetCloudflareContext,
}));

vi.mock("@/db", () => ({
  getDb: mockGetDb,
}));

vi.mock("@/lib/server/auth", () => ({
  getSession: mockGetSession,
}));

describe("POST /api/push/subscribe", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockGetCloudflareContext.mockReturnValue({ env: { DB: {} } });
    mockOnConflictDoUpdate.mockResolvedValue(undefined);
    mockInsertValues.mockReturnValue({
      onConflictDoUpdate: mockOnConflictDoUpdate,
    });
    mockDeleteWhere.mockResolvedValue(undefined);
    mockGetDb.mockReturnValue({
      insert: vi.fn(() => ({
        values: mockInsertValues,
      })),
      delete: vi.fn(() => ({
        where: mockDeleteWhere,
      })),
    });
  });

  it("세션이 없으면 401을 반환한다", async () => {
    mockGetSession.mockResolvedValue(null);

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/push/subscribe", {
        method: "POST",
        body: JSON.stringify({
          subscription: {
            endpoint: "https://push.example.com/subscription-1",
            keys: {
              p256dh: "p256dh-1",
              auth: "auth-1",
            },
          },
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }) as never,
    );

    expect(response.status).toBe(401);
    expect(mockInsertValues).not.toHaveBeenCalled();
  });

  it("클라이언트 userId 대신 세션 userId로 구독을 저장한다", async () => {
    mockGetSession.mockResolvedValue({ userId: 7 });

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/push/subscribe", {
        method: "POST",
        body: JSON.stringify({
          subscription: {
            endpoint: "https://push.example.com/subscription-1",
            keys: {
              p256dh: "p256dh-1",
              auth: "auth-1",
            },
          },
          userId: "999",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }) as never,
    );

    expect(response.status).toBe(200);
    expect(mockInsertValues).toHaveBeenCalledWith({
      userId: "7",
      endpoint: "https://push.example.com/subscription-1",
      p256dh: "p256dh-1",
      auth: "auth-1",
    });
    expect(mockOnConflictDoUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        set: expect.objectContaining({
          userId: "7",
        }),
      }),
    );
  });
});

describe("DELETE /api/push/subscribe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCloudflareContext.mockReturnValue({ env: { DB: {} } });
    mockGetDb.mockReturnValue({
      delete: vi.fn(() => ({
        where: mockDeleteWhere,
      })),
    });
    mockDeleteWhere.mockResolvedValue(undefined);
  });

  it("세션이 없으면 401을 반환한다", async () => {
    mockGetSession.mockResolvedValue(null);

    const { DELETE } = await import("./route");
    const response = await DELETE(
      new Request("http://localhost/api/push/subscribe", {
        method: "DELETE",
        body: JSON.stringify({
          endpoint: "https://push.example.com/subscription-1",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }) as never,
    );

    expect(response.status).toBe(401);
    expect(mockDeleteWhere).not.toHaveBeenCalled();
  });
});
