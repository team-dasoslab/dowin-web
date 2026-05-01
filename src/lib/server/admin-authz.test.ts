import {
  requireAdminRole,
  requireAdminSession,
  requireAnyAdminRole,
} from "@/lib/server/admin-authz";
import { ForbiddenError, UnauthorizedError } from "@/lib/server/errors";
import { getAdminSessionWithRefresh } from "@/lib/server/admin-auth";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/admin-auth", () => ({
  getAdminSessionWithRefresh: vi.fn(),
}));

describe("admin authz", () => {
  it("운영 세션이 없으면 UnauthorizedError를 던진다", async () => {
    vi.mocked(getAdminSessionWithRefresh).mockResolvedValueOnce(null);

    await expect(
      requireAdminSession({} as Parameters<typeof requireAdminSession>[0]),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("요구된 운영 권한이 없으면 ForbiddenError를 던진다", async () => {
    const db = {
      query: {
        adminRoleGrants: {
          findFirst: vi.fn().mockResolvedValue(null),
        },
      },
    } as unknown as Parameters<typeof requireAdminRole>[0];

    await expect(requireAdminRole(db, 7, "SYSTEM_ADMIN")).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("요구된 운영 권한이 있으면 grant를 반환한다", async () => {
    const grant = { id: 1, role: "SUPPORT_ADMIN", adminUserId: 7 };
    const db = {
      query: {
        adminRoleGrants: {
          findFirst: vi.fn().mockResolvedValue(grant),
        },
      },
    } as unknown as Parameters<typeof requireAdminRole>[0];

    await expect(requireAdminRole(db, 7, "SUPPORT_ADMIN")).resolves.toEqual(
      grant,
    );
  });

  it("여러 역할 중 하나라도 있으면 반환한다", async () => {
    const findFirst = vi
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 2,
        role: "RECOVERY_ADMIN",
        adminUserId: 7,
      });
    const db = {
      query: {
        adminRoleGrants: {
          findFirst,
        },
      },
    } as unknown as Parameters<typeof requireAnyAdminRole>[0];

    await expect(
      requireAnyAdminRole(db, 7, ["SUPPORT_ADMIN", "RECOVERY_ADMIN"]),
    ).resolves.toEqual({
      id: 2,
      role: "RECOVERY_ADMIN",
      adminUserId: 7,
    });
  });
});
