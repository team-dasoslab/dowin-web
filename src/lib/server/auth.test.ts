import { getSession } from "@/lib/server/auth";
import { cookies } from "next/headers";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

describe("getSession", () => {
  const mockCookies = vi.mocked(cookies);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-20T00:00:00.000Z"));
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
        sessions: {
          findFirst,
        },
      },
    } as unknown as Parameters<typeof getSession>[0];

    const session = await getSession(db);

    expect(session).toBeNull();
    expect(findFirst).not.toHaveBeenCalled();
  });

  it("세션이 유효하면 반환한다", async () => {
    const mockSession = {
      id: "session-123",
      userId: 1,
      expiresAt: new Date("2026-04-19T00:00:00.000Z"),
      createdAt: new Date("2026-03-20T00:00:00.000Z"),
    };

    const findFirst = vi.fn().mockResolvedValue(mockSession);

    mockCookies.mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: "session-123" }),
    } as never);

    const db = {
      query: {
        sessions: {
          findFirst,
        },
      },
      update: vi.fn(),
    } as unknown as Parameters<typeof getSession>[0];

    const session = await getSession(db);

    expect(session).toEqual(mockSession);
  });

  it("재발급 주기(3일) 이상 지난 세션은 만료를 연장하고 쿠키를 다시 설정한다", async () => {
    const now = new Date("2026-03-20T00:00:00.000Z");
    const soonExpiredSession = {
      id: "session-rotate",
      userId: 1,
      expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      createdAt: new Date("2026-03-15T00:00:00.000Z"),
    };

    const set = vi.fn().mockReturnValue({ where: vi.fn() });
    const update = vi.fn().mockReturnValue({ set });

    const cookieSet = vi.fn();
    mockCookies.mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: "session-rotate" }),
      set: cookieSet,
    } as never);

    const db = {
      query: {
        sessions: {
          findFirst: vi.fn().mockResolvedValue(soonExpiredSession),
        },
      },
      update,
    } as unknown as Parameters<typeof getSession>[0];

    await getSession(db);

    expect(update).toHaveBeenCalledTimes(1);
    expect(cookieSet).toHaveBeenCalledTimes(1);
  });
});
