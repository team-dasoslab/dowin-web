import { describe, expect, it, vi } from "vitest";
import {
  guardRestrictedTestAccountWrite,
  restrictedTestAccountForbiddenResponse,
} from "@/lib/server/restricted-test-account";

const createDb = (customId: string | null) =>
  ({
    query: {
      users: {
        findFirst: vi.fn().mockResolvedValue(
          customId === null ? null : { customId },
        ),
      },
    },
  }) as never;

describe("guardRestrictedTestAccountWrite", () => {
  it("production의 제한 계정은 일반 쓰기 요청이 차단된다", async () => {
    const response = await guardRestrictedTestAccountWrite({
      db: createDb("test2"),
      userId: 1,
      env: { NEXTJS_ENV: "production" },
      intent: "general-write",
    });

    expect(response?.status).toBe(restrictedTestAccountForbiddenResponse().status);
    await expect(response?.json()).resolves.toMatchObject({
      error: {
        code: "TEST_ACCOUNT_WRITE_RESTRICTED",
        message:
          "테스트 계정에서는 체크 기록과 프로필 아이콘 변경만 사용할 수 있어요.",
      },
    });
  });

  it("production의 제한 계정은 daily log 기록 PUT을 허용한다", async () => {
    const response = await guardRestrictedTestAccountWrite({
      db: createDb("test3"),
      userId: 1,
      env: { NEXTJS_ENV: "production" },
      intent: "daily-log-upsert",
    });

    expect(response).toBeNull();
  });

  it("production의 제한 계정은 avatar 전용 프로필 수정만 허용한다", async () => {
    const response = await guardRestrictedTestAccountWrite({
      db: createDb("test4"),
      userId: 1,
      env: { NEXTJS_ENV: "production" },
      intent: "profile-avatar-update",
    });

    expect(response).toBeNull();
  });

  it("production이 아니면 제한 계정도 일반 쓰기를 허용한다", async () => {
    const response = await guardRestrictedTestAccountWrite({
      db: createDb("test2"),
      userId: 1,
      env: { NEXTJS_ENV: "development" },
      intent: "general-write",
    });

    expect(response).toBeNull();
  });

  it("production이어도 일반 계정은 일반 쓰기를 허용한다", async () => {
    const response = await guardRestrictedTestAccountWrite({
      db: createDb("hb"),
      userId: 1,
      env: { NEXTJS_ENV: "production" },
      intent: "general-write",
    });

    expect(response).toBeNull();
  });
});
