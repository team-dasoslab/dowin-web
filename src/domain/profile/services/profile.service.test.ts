import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProfileService } from "@/domain/profile/services/profile.service";

describe("ProfileService", () => {
  const findProfileByUserId = vi.fn();
  const updateNickname = vi.fn();

  const service = new ProfileService({
    findProfileByUserId,
    updateNickname,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("내 프로필을 반환한다", async () => {
    findProfileByUserId.mockResolvedValue({
      id: 1,
      customId: "admin",
      nickname: "관리자",
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

  it("닉네임을 갱신한다", async () => {
    updateNickname.mockResolvedValue({
      id: 1,
      customId: "admin",
      nickname: "새닉네임",
      role: "ADMIN",
      workspaceId: 1,
      workspaceName: "위그",
      createdAt: new Date("2026-03-01T00:00:00Z"),
    });

    await expect(service.updateNickname(1, "새닉네임")).resolves.toMatchObject({
      nickname: "새닉네임",
    });
    expect(updateNickname).toHaveBeenCalledWith(1, "새닉네임");
  });
});
