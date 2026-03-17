import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { SESSION_TTL_MS } from "@/domain/auth/constants";
import { AuthStorage } from "@/domain/auth/storage/auth.storage";
import { ConflictError } from "@/lib/server/errors";

export interface AuthStoragePort {
  findUserByCustomId: AuthStorage["findUserByCustomId"];
  findUserById: AuthStorage["findUserById"];
  createUser: AuthStorage["createUser"];
  updateUserPassword: AuthStorage["updateUserPassword"];
  createSession: AuthStorage["createSession"];
  deleteSession: AuthStorage["deleteSession"];
}

export class AuthService {
  constructor(private storage: AuthStoragePort) {}

  async login(customId: string, password: string) {
    // 1. 사용자 조회
    const user = await this.storage.findUserByCustomId(customId);

    if (!user) {
      throw new Error("아이디 또는 비밀번호가 올바르지 않습니다");
    }

    // 2. 비밀번호 확인
    const isPasswordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordMatch) {
      throw new Error("아이디 또는 비밀번호가 올바르지 않습니다");
    }

    // 3. 세션 생성 (장기 유지)
    const sessionId = nanoid();
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

    await this.storage.createSession({
      id: sessionId,
      userId: user.id,
      expiresAt,
    });

    return {
      user: {
        id: user.id,
        nickname: user.nickname,
        isFirstLogin: user.isFirstLogin,
      },
      sessionId,
    };
  }

  async logout(sessionId: string) {
    await this.storage.deleteSession(sessionId);
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    // 1. 사용자 조회
    const user = await this.storage.findUserById(userId);

    if (!user) {
      throw new Error("사용자를 찾을 수 없습니다");
    }

    // 2. 현재 비밀번호 확인
    const isPasswordMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isPasswordMatch) {
      throw new Error("현재 비밀번호가 올바르지 않습니다");
    }

    // 3. 새 비밀번호 해싱 및 업데이트
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await this.storage.updateUserPassword(userId, newPasswordHash);
  }

  async createUser(customId: string, nickname: string, password: string) {
    const existing = await this.storage.findUserByCustomId(customId);
    if (existing) {
      throw new ConflictError("CUSTOM_ID_ALREADY_EXISTS");
    }

    const passwordHash = await bcrypt.hash(password, 10);

    try {
      const newUser = await this.storage.createUser({
        customId,
        nickname,
        passwordHash,
        isFirstLogin: true,
      });

      return newUser;
    } catch (error) {
      if (isCustomIdConflict(error)) {
        throw new ConflictError("CUSTOM_ID_ALREADY_EXISTS");
      }

      throw error;
    }
  }
}

function isCustomIdConflict(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.message.includes("users.custom_id") ||
    error.message.includes("custom_id") ||
    error.message.includes("UNIQUE constraint failed")
  );
}
