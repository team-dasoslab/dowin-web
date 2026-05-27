import { getDb } from "@/db";
import { customAlphabet } from "nanoid";
import {
  authLoginAttempts,
  authRecoveryCodes,
  pendingSignupCheckouts,
  sessions,
  users,
  workspaceBillingState,
  workspaceMembers,
  workspaces,
  workspaceSeatEntitlements,
} from "@/db/schema";
import { and, desc, eq, gt, inArray, isNull } from "drizzle-orm";

const generateWorkspaceUid = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  12,
);

export class AuthStorage {
  constructor(private db: ReturnType<typeof getDb>) {}

  async findUserByCustomId(customId: string) {
    return await this.db.query.users.findFirst({
      where: eq(users.customId, customId),
    });
  }

  async findActivePendingSignupCheckoutByCustomId(
    customId: string,
    now: Date,
  ) {
    return (
      (await this.db.query.pendingSignupCheckouts.findFirst({
        where: and(
          eq(pendingSignupCheckouts.customId, customId),
          inArray(pendingSignupCheckouts.status, [
            "PENDING",
            "CHECKOUT_CREATED",
          ]),
          gt(pendingSignupCheckouts.expiresAt, now),
        ),
        orderBy: [desc(pendingSignupCheckouts.createdAt)],
      })) ?? null
    );
  }

  async findPendingSignupCheckoutByRequestId(requestId: string) {
    return (
      (await this.db.query.pendingSignupCheckouts.findFirst({
        where: eq(pendingSignupCheckouts.requestId, requestId),
      })) ?? null
    );
  }

  async findPendingSignupCheckoutByUid(uid: string) {
    return (
      (await this.db.query.pendingSignupCheckouts.findFirst({
        where: eq(pendingSignupCheckouts.uid, uid),
      })) ?? null
    );
  }

  async createPendingSignupCheckout(input: {
    uid: string;
    requestId: string;
    customId: string;
    nickname: string;
    passwordHash: string;
    locale: "ko" | "en";
    workspaceName: string;
    requestedSeatCount: number;
    targetPlanCode: "BASIC";
    provider: "POLAR";
    providerProductId: string;
    expiresAt: Date;
  }) {
    const [created] = await this.db
      .insert(pendingSignupCheckouts)
      .values(input)
      .returning();

    return created;
  }

  async markPendingSignupCheckoutCreated(
    id: number,
    input: {
      providerCheckoutId: string | null;
      checkoutUrl: string;
    },
  ) {
    const [updated] = await this.db
      .update(pendingSignupCheckouts)
      .set({
        status: "CHECKOUT_CREATED",
        providerCheckoutId: input.providerCheckoutId,
        checkoutUrl: input.checkoutUrl,
        updatedAt: new Date(),
      })
      .where(eq(pendingSignupCheckouts.id, id))
      .returning();

    return updated ?? null;
  }

  async markPendingSignupCheckoutFailed(id: number) {
    const [updated] = await this.db
      .update(pendingSignupCheckouts)
      .set({
        status: "FAILED",
        updatedAt: new Date(),
      })
      .where(eq(pendingSignupCheckouts.id, id))
      .returning();

    return updated ?? null;
  }

  async provisionCompletedSignup(input: {
    pendingId: number;
    pendingUid: string;
    customId: string;
    nickname: string;
    passwordHash: string;
    locale: "ko" | "en";
    workspaceName: string;
    purchasedSeatCount: number;
    customerKey: string | null;
    subscriptionKey: string | null;
    now: Date;
  }) {
    const user = await this.createUser({
      customId: input.customId,
      nickname: input.nickname,
      passwordHash: input.passwordHash,
      isFirstLogin: true,
      locale: input.locale,
    });

    const [workspace] = await this.db
      .insert(workspaces)
      .values({
        uid: generateWorkspaceUid(),
        name: input.workspaceName,
        planCode: "BASIC",
        billingCustomerExternalRef: `signup:${input.pendingUid}`,
        billingOwnerUserId: user.id,
      })
      .returning();

    await this.db.insert(workspaceMembers).values({
      workspaceId: workspace.id,
      userId: user.id,
      role: "ADMIN",
    });

    await this.db.insert(workspaceBillingState).values({
      workspaceId: workspace.id,
      provider: "POLAR",
      billingStatus: "ACTIVE",
      planCode: "BASIC",
      entitlementSource: "POLAR",
      customerKey: input.customerKey,
      subscriptionKey: input.subscriptionKey,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      billingOwnerUserId: user.id,
      lastEventId: null,
      lastEventOccurredAt: input.now,
      updatedAt: input.now,
    });

    await this.db.insert(workspaceSeatEntitlements).values({
      workspaceId: workspace.id,
      planCode: "BASIC",
      purchasedSeatCount: input.purchasedSeatCount,
      seatSource: "POLAR",
      updatedAt: input.now,
    });

    await this.db
      .update(pendingSignupCheckouts)
      .set({
        status: "COMPLETED",
        completedUserId: user.id,
        completedWorkspaceId: workspace.id,
        completedAt: input.now,
        updatedAt: input.now,
      })
      .where(eq(pendingSignupCheckouts.id, input.pendingId));

    return { user, workspace };
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
    locale: string;
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

  async deleteSessionsByUserId(userId: number) {
    await this.db.delete(sessions).where(eq(sessions.userId, userId));
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

  async findLoginAttempt(customId: string, ipAddress: string) {
    return (
      (await this.db.query.authLoginAttempts.findFirst({
        where: and(
          eq(authLoginAttempts.customId, customId),
          eq(authLoginAttempts.ipAddress, ipAddress),
        ),
      })) ?? null
    );
  }

  async createLoginAttempt(input: {
    customId: string;
    ipAddress: string;
    failureCount: number;
    firstFailedAt: Date;
    lastFailedAt: Date;
    blockedUntil: Date | null;
  }) {
    const [created] = await this.db
      .insert(authLoginAttempts)
      .values(input)
      .returning();

    return created;
  }

  async updateLoginAttempt(
    id: number,
    input: {
      failureCount: number;
      firstFailedAt: Date;
      lastFailedAt: Date;
      blockedUntil: Date | null;
    },
  ) {
    const [updated] = await this.db
      .update(authLoginAttempts)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(authLoginAttempts.id, id))
      .returning();

    return updated ?? null;
  }

  async deleteLoginAttempt(customId: string, ipAddress: string) {
    await this.db
      .delete(authLoginAttempts)
      .where(
        and(
          eq(authLoginAttempts.customId, customId),
          eq(authLoginAttempts.ipAddress, ipAddress),
        ),
      );
  }
}
