import {
  ADMIN_SESSION_COOKIE,
  createAdminSession,
  getAdminSession,
  getAdminSessionWithRefresh,
  hashAdminSessionToken,
} from "@/lib/server/admin-auth";
import { cookies } from "next/headers";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
  headers: vi.fn(async () => new Map()),
}));

describe("admin auth", () => {
  const mockCookies = vi.mocked(cookies);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-01T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("쿠키가 없으면 null을 반환한다", async () => {
    const findFirst = vi.fn();

    mockCookies.mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
    } as never);

    const db = {
      query: {
        adminSessions: {
          findFirst,
        },
      },
    } as unknown as Parameters<typeof getAdminSession>[0];

    const session = await getAdminSession(db);

    expect(session).toBeNull();
    expect(findFirst).not.toHaveBeenCalled();
  });

  it("hash 기준으로 유효한 admin 세션을 반환한다", async () => {
    const rawToken = "admin-session-token";
    const mockSession = {
      id: "row-id",
      adminUserId: 7,
      expiresAt: new Date("2026-05-01T03:00:00.000Z"),
    };
    const findFirst = vi.fn().mockResolvedValue(mockSession);

    mockCookies.mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: rawToken }),
    } as never);

    const db = {
      query: {
        adminSessions: {
          findFirst,
        },
      },
    } as unknown as Parameters<typeof getAdminSession>[0];

    const session = await getAdminSession(db);

    expect(session).toEqual(mockSession);
    expect(findFirst).toHaveBeenCalledTimes(1);
  });

  it("route handler 세션 조회는 재발급 주기 이후면 쿠키를 다시 설정한다", async () => {
    const rawToken = "admin-session-token";
    const soonExpiredSession = {
      id: "row-id",
      adminUserId: 7,
      expiresAt: new Date("2026-05-01T00:20:00.000Z"),
    };

    const set = vi.fn().mockReturnValue({ where: vi.fn() });
    const update = vi.fn().mockReturnValue({ set });
    const cookieSet = vi.fn();

    mockCookies.mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: rawToken }),
      set: cookieSet,
    } as never);

    const db = {
      query: {
        adminSessions: {
          findFirst: vi.fn().mockResolvedValue(soonExpiredSession),
        },
      },
      update,
    } as unknown as Parameters<typeof getAdminSessionWithRefresh>[0];

    await getAdminSessionWithRefresh(db);

    expect(update).toHaveBeenCalledTimes(1);
    expect(cookieSet).toHaveBeenCalledWith(
      ADMIN_SESSION_COOKIE,
      rawToken,
      expect.objectContaining({
        httpOnly: true,
        sameSite: "strict",
      }),
    );
  });

  it("admin session 생성 시 token hash를 저장한다", async () => {
    const insertValues = vi.fn();
    const insert = vi.fn().mockReturnValue({ values: insertValues });

    const db = {
      insert,
    } as unknown as Parameters<typeof createAdminSession>[0];

    const result = await createAdminSession(db, 11, {
      ipAddress: "127.0.0.1",
      userAgent: "Vitest",
    });

    expect(result.sessionToken).toBeTypeOf("string");
    expect(insert).toHaveBeenCalledTimes(1);
    expect(insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        adminUserId: 11,
        sessionTokenHash: hashAdminSessionToken(result.sessionToken),
        ipAddress: "127.0.0.1",
        userAgent: "Vitest",
      }),
    );
  });
});
