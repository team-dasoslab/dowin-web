import { AdminAuthService } from "@/domain/admin/services/admin-auth.service";
import { ForbiddenError, UnauthorizedError } from "@/lib/server/errors";
import bcrypt from "bcryptjs";
import { describe, expect, it, vi } from "vitest";

describe("AdminAuthService", () => {
  it("로그인 성공 시 세션과 역할을 반환한다", async () => {
    const now = new Date("2026-05-01T00:00:00.000Z");
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const compareSpy = vi.spyOn(bcrypt, "compare").mockResolvedValue(true as never);
    const storage = {
      findAdminUserByLoginId: vi.fn().mockResolvedValue({
        id: 1,
        loginId: "ops-admin",
        passwordHash: "hashed",
        displayName: "Ops Admin",
        status: "ACTIVE",
        mfaEnabled: false,
        lastLoginAt: null,
      }),
      findAdminUserById: vi.fn(),
      listActiveRolesByAdminUserId: vi
        .fn()
        .mockResolvedValue(["SUPPORT_ADMIN", "SYSTEM_ADMIN"]),
      createAdminSession: vi.fn(),
      updateAdminUserLastLoginAt: vi.fn(),
    };

    const service = new AdminAuthService(storage);
    const result = await service.login("ops-admin", "pw", {
      ipAddress: "127.0.0.1",
      userAgent: "Vitest",
    });

    expect(result.adminUser.loginId).toBe("ops-admin");
    expect(result.roles).toEqual(["SUPPORT_ADMIN", "SYSTEM_ADMIN"]);
    expect(storage.createAdminSession).toHaveBeenCalledTimes(1);
    expect(storage.updateAdminUserLastLoginAt).toHaveBeenCalledTimes(1);
    compareSpy.mockRestore();
    vi.useRealTimers();
  });

  it("운영자 계정이 없으면 INVALID_CREDENTIALS로 막는다", async () => {
    const storage = {
      findAdminUserByLoginId: vi.fn().mockResolvedValue(null),
      findAdminUserById: vi.fn(),
      listActiveRolesByAdminUserId: vi.fn(),
      createAdminSession: vi.fn(),
      updateAdminUserLastLoginAt: vi.fn(),
    };

    const service = new AdminAuthService(storage);

    await expect(service.login("missing", "pw")).rejects.toEqual(
      expect.objectContaining<Partial<UnauthorizedError>>({
        code: "INVALID_CREDENTIALS",
      }),
    );
  });

  it("비활성 운영자 계정이면 FORBIDDEN으로 막는다", async () => {
    const storage = {
      findAdminUserByLoginId: vi.fn().mockResolvedValue({
        id: 1,
        loginId: "ops-admin",
        passwordHash: "hashed",
        displayName: "Ops Admin",
        status: "SUSPENDED",
        mfaEnabled: false,
        lastLoginAt: null,
      }),
      findAdminUserById: vi.fn(),
      listActiveRolesByAdminUserId: vi.fn(),
      createAdminSession: vi.fn(),
      updateAdminUserLastLoginAt: vi.fn(),
    };

    const service = new AdminAuthService(storage);

    await expect(service.login("ops-admin", "pw")).rejects.toEqual(
      expect.objectContaining<Partial<ForbiddenError>>({
        code: "FORBIDDEN",
      }),
    );
  });

  it("세션 프로필 조회는 활성 운영자와 역할을 반환한다", async () => {
    const storage = {
      findAdminUserByLoginId: vi.fn(),
      findAdminUserById: vi.fn().mockResolvedValue({
        id: 1,
        loginId: "ops-admin",
        passwordHash: "hashed",
        displayName: "Ops Admin",
        status: "ACTIVE",
        mfaEnabled: true,
        lastLoginAt: new Date("2026-05-01T00:00:00.000Z"),
      }),
      listActiveRolesByAdminUserId: vi
        .fn()
        .mockResolvedValue(["RECOVERY_ADMIN"]),
      createAdminSession: vi.fn(),
      updateAdminUserLastLoginAt: vi.fn(),
    };

    const service = new AdminAuthService(storage);
    const result = await service.getSessionProfile(1);

    expect(result.roles).toEqual(["RECOVERY_ADMIN"]);
    expect(result.adminUser.mfaEnabled).toBe(true);
  });
});
