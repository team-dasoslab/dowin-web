import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProfileService } from "@/domain/profile/services/profile.service";

describe("ProfileService", () => {
  const findProfileByUserId = vi.fn();
  const updateProfile = vi.fn();

  const service = new ProfileService({
    findProfileByUserId,
    updateProfile,
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
});
