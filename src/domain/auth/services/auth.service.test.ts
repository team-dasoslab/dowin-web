import {
  AuthService,
  type AuthStoragePort,
} from "@/domain/auth/services/auth.service";
import { SESSION_TTL_MS } from "@/domain/auth/constants";
import bcrypt from "bcryptjs";
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockedFunction,
} from "vitest";

type MockStorage = {
  [K in keyof AuthStoragePort]: MockedFunction<AuthStoragePort[K]>;
};

const createMockStorage = (): MockStorage => ({
  findUserByCustomId: vi.fn(),
  findUserById: vi.fn(),
  createUser: vi.fn(),
  updateUserPassword: vi.fn(),
  createSession: vi.fn(),
  createRecoveryCodes: vi.fn(),
  findRecoveryCodeWithUser: vi.fn(),
  consumeRecoveryCode: vi.fn(),
  deleteSession: vi.fn(),
});

describe("Auth Service - login", () => {
  const mockStorage = createMockStorage();
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
      avatarKey: null,
      isFirstLogin: true,
      createdAt: new Date(),
    };

    mockStorage.findUserByCustomId.mockResolvedValue(mockUser);

    const result = await service.login("john123", "password123");

    expect(result.user.id).toBe(1);
    expect(result.user.nickname).toBe("John");
    expect(result.sessionId).toBeDefined();
    expect(mockStorage.findUserByCustomId).toHaveBeenCalled();
    expect(mockStorage.createSession).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 1,
        expiresAt: expect.any(Date),
      }),
    );

    const expiresAt = mockStorage.createSession.mock.calls[0]?.[0]?.expiresAt;
    expect(expiresAt.getTime()).toBeGreaterThan(
      Date.now() + SESSION_TTL_MS - 5_000,
    );
  });

  it("아이디가 존재하지 않으면 에러를 던진다", async () => {
    mockStorage.findUserByCustomId.mockResolvedValue(undefined);

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
      avatarKey: null,
      isFirstLogin: true,
      createdAt: new Date(),
    };
    mockStorage.findUserByCustomId.mockResolvedValue(mockUser);

    await expect(service.login("john123", "wrong-pass")).rejects.toThrow(
      "아이디 또는 비밀번호가 올바르지 않습니다",
    );
  });
});

describe("Auth Service - signup", () => {
  const mockStorage = createMockStorage();
  const service = new AuthService(mockStorage);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("회원가입 시 사용자를 생성하고 세션을 발급한다", async () => {
    mockStorage.findUserByCustomId.mockResolvedValue(undefined);
    mockStorage.createUser.mockResolvedValue({
      id: 7,
      customId: "newuser",
      nickname: "New User",
      avatarKey: null,
      passwordHash: "hashed-password",
      isFirstLogin: true,
      createdAt: new Date(),
    });

    const result = await service.signup("newuser", "New User", "newSecurePass1!");

    expect(result.user).toEqual({
      id: 7,
      nickname: "New User",
      isFirstLogin: true,
    });
    expect(result.recoveryCodes).toHaveLength(8);
    expect(result.recoveryCodes.every((code) => typeof code === "string")).toBe(
      true,
    );
    expect(result.sessionId).toBeDefined();
    expect(mockStorage.createUser).toHaveBeenCalled();
    expect(mockStorage.createRecoveryCodes).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          userId: 7,
          codeHash: expect.any(String),
        }),
      ]),
    );
    expect(mockStorage.createRecoveryCodes.mock.calls[0]?.[0]).toHaveLength(8);
    expect(mockStorage.createSession).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 7,
        expiresAt: expect.any(Date),
      }),
    );
  });
});

describe("Auth Service - logout", () => {
  const mockStorage = createMockStorage();
  const service = new AuthService(mockStorage);

  it("세션 ID가 주어지면 세션을 삭제한다", async () => {
    await service.logout("session-123");
    expect(mockStorage.deleteSession).toHaveBeenCalledWith("session-123");
  });
});

describe("Auth Service - changePassword", () => {
  const mockStorage = createMockStorage();
  const service = new AuthService(mockStorage);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("현재 비밀번호가 일치하면 새 비밀번호로 업데이트한다", async () => {
    const mockUser = {
      id: 1,
      passwordHash: await bcrypt.hash("old-pass", 10),
      createdAt: new Date(),
      customId: "john123",
      nickname: "John",
      avatarKey: null,
      isFirstLogin: false,
    };
    mockStorage.findUserById.mockResolvedValue(mockUser);

    await service.changePassword(1, "old-pass", "new-pass-123!");

    expect(mockStorage.updateUserPassword).toHaveBeenCalled();
  });

  it("현재 비밀번호가 일치하지 않으면 에러를 던진다", async () => {
    const mockUser = {
      id: 1,
      passwordHash: await bcrypt.hash("old-pass", 10),
      createdAt: new Date(),
      customId: "john123",
      nickname: "John",
      avatarKey: null,
      isFirstLogin: false,
    };
    mockStorage.findUserById.mockResolvedValue(mockUser);

    await expect(
      service.changePassword(1, "wrong-pass", "new-pass"),
    ).rejects.toThrow("현재 비밀번호가 올바르지 않습니다");
  });
});

describe("Auth Service - createUser", () => {
  const mockStorage = createMockStorage();
  const service = new AuthService(mockStorage);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("새로운 사용자를 전달받은 비밀번호로 생성한다", async () => {
    const mockCreatedUser = {
      id: 2,
      customId: "newmember",
      nickname: "New Member",
      avatarKey: null,
      passwordHash: "hashed-password",
      isFirstLogin: true,
      createdAt: new Date(),
    };
    mockStorage.createUser.mockResolvedValue(mockCreatedUser);

    const result = await service.createUser(
      "newmember",
      "New Member",
      "newSecurePass1!",
    );

    expect(result.customId).toBe("newmember");
    expect(result).not.toHaveProperty("initialPassword");
    expect(mockStorage.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        customId: "newmember",
        nickname: "New Member",
        isFirstLogin: true,
        passwordHash: expect.any(String),
      }),
    );
  });

  it("이미 사용 중인 아이디면 409 충돌 에러를 던진다", async () => {
    mockStorage.findUserByCustomId.mockResolvedValue({
      id: 2,
      customId: "newmember",
      nickname: "Existing",
      avatarKey: null,
      passwordHash: "hashed-password",
      isFirstLogin: false,
      createdAt: new Date(),
    });

    await expect(
      service.createUser("newmember", "New Member", "newSecurePass1!"),
    ).rejects.toThrow("CUSTOM_ID_ALREADY_EXISTS");
  });
});

describe("Auth Service - verifyRecoveryCode", () => {
  const mockStorage = createMockStorage();
  const service = new AuthService(mockStorage);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("유효한 복원코드면 계정 정보를 반환한다", async () => {
    mockStorage.findRecoveryCodeWithUser.mockResolvedValue({
      id: 1,
      userId: 7,
      codeHash: "hashed",
      usedAt: null,
      createdAt: new Date(),
      user: {
        id: 7,
        customId: "john123",
        passwordHash: "hashed-password",
        nickname: "존",
        avatarKey: null,
        isFirstLogin: false,
        createdAt: new Date(),
      },
    });

    const result = await service.verifyRecoveryCode("ABCDEFGH23");

    expect(result).toEqual({
      customId: "john123",
      nickname: "존",
    });
  });

  it("유효하지 않거나 이미 사용된 복원코드면 에러를 던진다", async () => {
    mockStorage.findRecoveryCodeWithUser.mockResolvedValue(undefined);

    await expect(service.verifyRecoveryCode("INVALID123")).rejects.toThrow(
      "INVALID_RECOVERY_CODE",
    );
  });
});

describe("Auth Service - resetPasswordByRecoveryCode", () => {
  const mockStorage = createMockStorage();
  const service = new AuthService(mockStorage);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("복원코드가 유효하면 비밀번호를 재설정하고 코드를 소진한다", async () => {
    mockStorage.consumeRecoveryCode.mockResolvedValue(7);

    await service.resetPasswordByRecoveryCode("ABCDEFGH23", "new-pass-123!");

    expect(mockStorage.consumeRecoveryCode).toHaveBeenCalled();
    expect(mockStorage.updateUserPassword).toHaveBeenCalledWith(
      7,
      expect.any(String),
    );
  });

  it("복원코드가 유효하지 않으면 에러를 던진다", async () => {
    mockStorage.consumeRecoveryCode.mockResolvedValue(null);

    await expect(
      service.resetPasswordByRecoveryCode("INVALID123", "new-pass-123!"),
    ).rejects.toThrow("INVALID_RECOVERY_CODE");
  });
});
