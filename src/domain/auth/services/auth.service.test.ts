import bcrypt from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthService } from "@/domain/auth/services/auth.service";

describe("Auth Service - login", () => {
  const mockStorage = {
    findUserByCustomId: vi.fn(),
    createSession: vi.fn(),
  } as any;
  const service = new AuthService(mockStorage);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("유효한 아이디와 비밀번호로 로그인 성공 시 사용자 정보와 세션을 반환한다", async () => {
    const mockUser = {
      id: 1,
      customId: "john123",
      passwordHash: await bcrypt.hash("password123", 10),
      nickname: "John",
      isFirstLogin: true,
    };

    mockStorage.findUserByCustomId.mockResolvedValue(mockUser);

    const result = await service.login("john123", "password123");

    expect(result.user.id).toBe(1);
    expect(result.user.nickname).toBe("John");
    expect(result.sessionId).toBeDefined();
    expect(mockStorage.findUserByCustomId).toHaveBeenCalled();
  });

  it("아이디가 존재하지 않으면 에러를 던진다", async () => {
    mockStorage.findUserByCustomId.mockResolvedValue(null);

    await expect(service.login("unknown", "pass")).rejects.toThrow(
      "아이디 또는 비밀번호가 올바르지 않습니다",
    );
  });

  it("비밀번호가 틀리면 에러를 던진다", async () => {
    const mockUser = {
      id: 1,
      customId: "john123",
      passwordHash: await bcrypt.hash("correct-pass", 10),
      nickname: "John",
      isFirstLogin: true,
    };
    mockStorage.findUserByCustomId.mockResolvedValue(mockUser);

    await expect(service.login("john123", "wrong-pass")).rejects.toThrow(
      "아이디 또는 비밀번호가 올바르지 않습니다",
    );
  });
});

describe("Auth Service - logout", () => {
  const mockStorage = {
    deleteSession: vi.fn(),
  } as any;
  const service = new AuthService(mockStorage);

  it("세션 ID가 주어지면 세션을 삭제한다", async () => {
    await service.logout("session-123");
    expect(mockStorage.deleteSession).toHaveBeenCalledWith("session-123");
  });
});

describe("Auth Service - changePassword", () => {
  const mockStorage = {
    findUserById: vi.fn(),
    updateUserPassword: vi.fn(),
  } as any;
  const service = new AuthService(mockStorage);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("현재 비밀번호가 일치하면 새 비밀번호로 업데이트한다", async () => {
    const mockUser = {
      id: 1,
      passwordHash: await bcrypt.hash("old-pass", 10),
    };
    mockStorage.findUserById.mockResolvedValue(mockUser);

    await service.changePassword(1, "old-pass", "new-pass-123!");

    expect(mockStorage.updateUserPassword).toHaveBeenCalled();
  });

  it("현재 비밀번호가 일치하지 않으면 에러를 던진다", async () => {
    const mockUser = {
      id: 1,
      passwordHash: await bcrypt.hash("old-pass", 10),
    };
    mockStorage.findUserById.mockResolvedValue(mockUser);

    await expect(
      service.changePassword(1, "wrong-pass", "new-pass"),
    ).rejects.toThrow("현재 비밀번호가 올바르지 않습니다");
  });
});

describe("Auth Service - createUser", () => {
  const mockStorage = {
    createUser: vi.fn(),
  } as any;
  const service = new AuthService(mockStorage);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("새로운 사용자를 초기 비밀번호 'user'와 함께 생성한다", async () => {
    const mockCreatedUser = {
      id: 2,
      customId: "newmember",
      nickname: "New Member",
    };
    mockStorage.createUser.mockResolvedValue(mockCreatedUser);

    const result = await service.createUser("newmember", "New Member");

    expect(result.customId).toBe("newmember");
    expect(result.initialPassword).toBe("user");
    expect(mockStorage.createUser).toHaveBeenCalled();
  });
});
