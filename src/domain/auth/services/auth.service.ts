import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { AuthStorage } from "@/domain/auth/storage/auth.storage";

export class AuthService {
  constructor(private storage: AuthStorage) {}

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

    // 3. 세션 생성 (24시간 유효)
    const sessionId = nanoid();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

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

  async createUser(customId: string, nickname: string) {
    const initialPassword = "user";
    const passwordHash = await bcrypt.hash(initialPassword, 10);

    const newUser = await this.storage.createUser({
      customId,
      nickname,
      passwordHash,
      isFirstLogin: true,
    });

    return {
      ...newUser,
      initialPassword,
    };
  }
}
