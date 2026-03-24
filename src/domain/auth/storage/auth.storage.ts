import { getDb } from "@/db";
import { authRecoveryCodes, sessions, users } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";

export class AuthStorage {
  constructor(private db: ReturnType<typeof getDb>) {}

  async findUserByCustomId(customId: string) {
    return await this.db.query.users.findFirst({
      where: eq(users.customId, customId),
    });
  }

  async findUserById(id: number) {
    return await this.db.query.users.findFirst({
      where: eq(users.id, id),
    });
  }

  async createUser(data: {
    customId: string;
    nickname: string;
    passwordHash: string;
    isFirstLogin: boolean;
  }) {
    const [newUser] = await this.db.insert(users).values(data).returning();
    return newUser;
  }

  async updateUserPassword(userId: number, passwordHash: string) {
    await this.db
      .update(users)
      .set({
        passwordHash,
        isFirstLogin: false,
      })
      .where(eq(users.id, userId));
  }

  async createSession(data: { id: string; userId: number; expiresAt: Date }) {
    await this.db.insert(sessions).values(data);
  }

  async createRecoveryCodes(
    data: Array<{
      userId: number;
      codeHash: string;
    }>,
  ) {
    await this.db.insert(authRecoveryCodes).values(data);
  }

  async findRecoveryCodeWithUser(codeHash: string) {
    return await this.db.query.authRecoveryCodes.findFirst({
      where: eq(authRecoveryCodes.codeHash, codeHash),
      with: {
        user: true,
      },
    });
  }

  async consumeRecoveryCode(codeHash: string): Promise<number | null> {
    const [consumed] = await this.db
      .update(authRecoveryCodes)
      .set({
        usedAt: new Date(),
      })
      .where(
        and(
          eq(authRecoveryCodes.codeHash, codeHash),
          isNull(authRecoveryCodes.usedAt),
        ),
      )
      .returning({
        userId: authRecoveryCodes.userId,
      });

    return consumed?.userId ?? null;
  }

  async deleteSession(sessionId: string) {
    await this.db.delete(sessions).where(eq(sessions.id, sessionId));
  }
}
