import { eq } from "drizzle-orm";
import { users, sessions } from "@/db/schema";

export class AuthStorage {
  constructor(private db: any) {}

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

  async createUser(data: { customId: string; nickname: string; passwordHash: string; isFirstLogin: boolean }) {
    const [newUser] = await this.db
      .insert(users)
      .values(data)
      .returning();
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

  async deleteSession(sessionId: string) {
    await this.db.delete(sessions).where(eq(sessions.id, sessionId));
  }
}
