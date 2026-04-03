import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProfileService } from "@/domain/profile/services/profile.service";
import bcrypt from "bcryptjs";

describe("ProfileService", () => {
  const findProfileByUserId = vi.fn();
  const updateProfile = vi.fn();
  const findDeletionContextByUserId = vi.fn();
  const countWorkspaceAdmins = vi.fn();
  const deleteUser = vi.fn();

  const service = new ProfileService({
    findProfileByUserId,
    updateProfile,
    findDeletionContextByUserId,
    countWorkspaceAdmins,
    deleteUser,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("내 프로필을 반환한다", async () => {
    findProfileByUserId.mockResolvedValue({
      id: 1,
      customId: "admin",
      nickname: "관리자",
      avatarKey: null,
      role: "ADMIN",
      workspaceId: 1,
      workspaceName: "위그",
      createdAt: new Date("2026-03-01T00:00:00Z"),
    });

    await expect(service.getMyProfile(1)).resolves.toMatchObject({
      id: 1,
      nickname: "관리자",
    });
  });

  it("프로필을 갱신한다", async () => {
    updateProfile.mockResolvedValue({
      id: 1,
      customId: "admin",
      nickname: "새닉네임",
      avatarKey: "smile.blue",
      role: "ADMIN",
      workspaceId: 1,
      workspaceName: "위그",
      createdAt: new Date("2026-03-01T00:00:00Z"),
    });

    await expect(
      service.updateProfile(1, { nickname: "새닉네임", avatarKey: "smile.blue" }),
    ).resolves.toMatchObject({
      nickname: "새닉네임",
      avatarKey: "smile.blue",
    });
    expect(updateProfile).toHaveBeenCalledWith(1, {
      nickname: "새닉네임",
      avatarKey: "smile.blue",
    });
  });

  it("MEMBER는 현재 비밀번호 확인 후 계정을 탈퇴한다", async () => {
    findDeletionContextByUserId.mockResolvedValue({
      id: 1,
      passwordHash: await bcrypt.hash("password123", 10),
      membership: {
        id: 9,
        workspaceId: 2,
        role: "MEMBER",
      },
    });

    await service.deleteMyAccount(1, "password123");

    expect(deleteUser).toHaveBeenCalledWith(1);
  });

  it("현재 비밀번호가 다르면 탈퇴를 막는다", async () => {
    findDeletionContextByUserId.mockResolvedValue({
      id: 1,
      passwordHash: await bcrypt.hash("password123", 10),
      membership: null,
    });

    await expect(service.deleteMyAccount(1, "wrong-password")).rejects.toThrow(
      "WRONG_PASSWORD",
    );
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it("유일한 ADMIN은 계정을 탈퇴할 수 없다", async () => {
    findDeletionContextByUserId.mockResolvedValue({
      id: 1,
      passwordHash: await bcrypt.hash("password123", 10),
      membership: {
        id: 9,
        workspaceId: 2,
        role: "ADMIN",
      },
    });
    countWorkspaceAdmins.mockResolvedValue(1);

    await expect(service.deleteMyAccount(1, "password123")).rejects.toThrow(
      "LAST_ADMIN_ACCOUNT_DELETION_FORBIDDEN",
    );
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it("다른 ADMIN이 있으면 ADMIN도 계정을 탈퇴할 수 있다", async () => {
    findDeletionContextByUserId.mockResolvedValue({
      id: 1,
      passwordHash: await bcrypt.hash("password123", 10),
      membership: {
        id: 9,
        workspaceId: 2,
        role: "ADMIN",
      },
    });
    countWorkspaceAdmins.mockResolvedValue(2);

    await service.deleteMyAccount(1, "password123");

    expect(deleteUser).toHaveBeenCalledWith(1);
  });
});
