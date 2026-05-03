import bcrypt from "bcryptjs";
import { nanoid, customAlphabet } from "nanoid";
import { createHash } from "node:crypto";
import { SESSION_TTL_MS } from "@/domain/auth/constants";
import { AuthStorage } from "@/domain/auth/storage/auth.storage";
import {
  ConflictError,
  NotFoundError,
  TooManyRequestsError,
} from "@/lib/server/errors";

const RECOVERY_CODE_COUNT = 8;
const RECOVERY_CODE_LENGTH = 10;
const RECOVERY_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const LOGIN_RATE_LIMIT_MAX_FAILURES = 10;
const LOGIN_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const generateRecoveryCode = customAlphabet(
  RECOVERY_CODE_ALPHABET,
  RECOVERY_CODE_LENGTH,
);

type LoginAttemptRecord = NonNullable<
  Awaited<ReturnType<AuthStorage["findLoginAttempt"]>>
>;

export interface AuthStoragePort {
  findUserByCustomId: AuthStorage["findUserByCustomId"];
  findUserById: AuthStorage["findUserById"];
  createUser: AuthStorage["createUser"];
  updateUserPassword: AuthStorage["updateUserPassword"];
  deleteSessionsByUserId: AuthStorage["deleteSessionsByUserId"];
  createSession: AuthStorage["createSession"];
  createRecoveryCodes: AuthStorage["createRecoveryCodes"];
  findRecoveryCodeWithUser: AuthStorage["findRecoveryCodeWithUser"];
  consumeRecoveryCode: AuthStorage["consumeRecoveryCode"];
  deleteSession: AuthStorage["deleteSession"];
  findLoginAttempt: AuthStorage["findLoginAttempt"];
  createLoginAttempt: AuthStorage["createLoginAttempt"];
  updateLoginAttempt: AuthStorage["updateLoginAttempt"];
  deleteLoginAttempt: AuthStorage["deleteLoginAttempt"];
}

export class AuthService {
  constructor(private storage: AuthStoragePort) {}

  async signup(customId: string, nickname: string, password: string, locale: string = "ko") {
    const user = await this.createUser(customId, nickname, password, locale);
    const recoveryCodes = Array.from(
      { length: RECOVERY_CODE_COUNT },
      () => generateRecoveryCode(),
    );

    await this.storage.createRecoveryCodes(
      recoveryCodes.map((code) => ({
        userId: user.id,
        codeHash: hashRecoveryCode(code),
      })),
    );

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
        locale: user.locale,
      },
      recoveryCodes,
      sessionId,
    };
  }

  async login(customId: string, password: string, ipAddress = "") {
    const now = new Date();
    const loginAttempt = await this.storage.findLoginAttempt(customId, ipAddress);

    if (isLoginBlocked(loginAttempt, now)) {
      throw new TooManyRequestsError("LOGIN_RATE_LIMITED");
    }

    // 1. 사용자 조회
    const user = await this.storage.findUserByCustomId(customId);

    if (!user) {
      await this.recordFailedLoginAttempt(customId, ipAddress, loginAttempt, now);
      throw new Error("아이디 또는 비밀번호가 올바르지 않습니다");
    }

    // 2. 비밀번호 확인
    const isPasswordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordMatch) {
      await this.recordFailedLoginAttempt(customId, ipAddress, loginAttempt, now);
      throw new Error("아이디 또는 비밀번호가 올바르지 않습니다");
    }

    await this.storage.deleteLoginAttempt(customId, ipAddress);

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
        locale: user.locale,
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
    await this.storage.deleteSessionsByUserId(userId);
  }

  async verifyRecoveryCode(recoveryCode: string) {
    const record = await this.storage.findRecoveryCodeWithUser(
      hashRecoveryCode(recoveryCode),
    );

    if (!record || record.usedAt) {
      throw new NotFoundError("INVALID_RECOVERY_CODE");
    }

    return {
      customId: record.user.customId,
      nickname: record.user.nickname,
    };
  }

  async resetPasswordByRecoveryCode(recoveryCode: string, newPassword: string) {
    const userId = await this.storage.consumeRecoveryCode(
      hashRecoveryCode(recoveryCode),
    );
    if (!userId) {
      throw new NotFoundError("INVALID_RECOVERY_CODE");
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await this.storage.updateUserPassword(userId, newPasswordHash);
    await this.storage.deleteSessionsByUserId(userId);
  }

  async createUser(customId: string, nickname: string, password: string, locale: string = "ko") {
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
        locale,
      });

      return newUser;
    } catch (error) {
      if (isCustomIdConflict(error)) {
        throw new ConflictError("CUSTOM_ID_ALREADY_EXISTS");
      }

      throw error;
    }
  }

  private async recordFailedLoginAttempt(
    customId: string,
    ipAddress: string,
    loginAttempt: LoginAttemptRecord | null,
    now: Date,
  ) {
    const nextAttempt = getNextLoginAttemptState(loginAttempt, now);

    if (!loginAttempt) {
      await this.storage.createLoginAttempt({
        customId,
        ipAddress,
        ...nextAttempt,
      });
    } else {
      await this.storage.updateLoginAttempt(loginAttempt.id, nextAttempt);
    }

    if (nextAttempt.blockedUntil) {
      throw new TooManyRequestsError("LOGIN_RATE_LIMITED");
    }
  }
}

function isLoginBlocked(loginAttempt: LoginAttemptRecord | null, now: Date) {
  return (
    loginAttempt?.blockedUntil != null &&
    loginAttempt.blockedUntil.getTime() > now.getTime()
  );
}

function getNextLoginAttemptState(
  loginAttempt: LoginAttemptRecord | null,
  now: Date,
) {
  if (!loginAttempt || hasLoginAttemptWindowExpired(loginAttempt, now)) {
    return {
      failureCount: 1,
      firstFailedAt: now,
      lastFailedAt: now,
      blockedUntil: null,
    };
  }

  const failureCount = loginAttempt.failureCount + 1;

  return {
    failureCount,
    firstFailedAt: loginAttempt.firstFailedAt,
    lastFailedAt: now,
    blockedUntil:
      failureCount >= LOGIN_RATE_LIMIT_MAX_FAILURES
        ? new Date(now.getTime() + LOGIN_RATE_LIMIT_WINDOW_MS)
        : null,
  };
}

function hasLoginAttemptWindowExpired(
  loginAttempt: LoginAttemptRecord,
  now: Date,
) {
  return (
    now.getTime() - loginAttempt.firstFailedAt.getTime() >=
    LOGIN_RATE_LIMIT_WINDOW_MS
  );
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

function hashRecoveryCode(code: string) {
  return createHash("sha256").update(code).digest("hex");
}
