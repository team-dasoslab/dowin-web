import { getDb } from "@/db";
import {
  leadMeasures,
  pushSubscriptions,
  scoreboards,
  userNotificationSettings,
  workspaceMembers,
} from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";

type Db = ReturnType<typeof getDb>;

export type PushSubscriptionRecord = typeof pushSubscriptions.$inferSelect;
export type UserNotificationSettingsRecord =
  typeof userNotificationSettings.$inferSelect;

export class NotificationStorage {
  constructor(private db: Db) {}

  async upsertPushSubscription(input: {
    userId: number;
    endpoint: string;
    p256dh: string;
    auth: string;
  }): Promise<void> {
    await this.db
      .insert(pushSubscriptions)
      .values({
        userId: String(input.userId),
        endpoint: input.endpoint,
        p256dh: input.p256dh,
        auth: input.auth,
      })
      .onConflictDoUpdate({
        target: pushSubscriptions.endpoint,
        set: {
          userId: String(input.userId),
          p256dh: input.p256dh,
          auth: input.auth,
        },
      });
  }

  async deletePushSubscriptionByEndpoint(endpoint: string): Promise<void> {
    await this.db
      .delete(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, endpoint));
  }

  async findAllPushSubscriptions(): Promise<PushSubscriptionRecord[]> {
    return await this.db.select().from(pushSubscriptions);
  }

  async findPushSubscriptionsByUserIds(
    userIds: number[],
  ): Promise<PushSubscriptionRecord[]> {
    if (userIds.length === 0) {
      return [];
    }

    return await this.db
      .select()
      .from(pushSubscriptions)
      .where(inArray(pushSubscriptions.userId, userIds.map(String)));
  }

  async findUserNotificationSettings(
    userId: number,
  ): Promise<UserNotificationSettingsRecord | null> {
    return (
      (await this.db.query.userNotificationSettings.findFirst({
        where: eq(userNotificationSettings.userId, userId),
      })) ?? null
    );
  }

  async findUserNotificationSettingsByUserIds(
    userIds: number[],
  ): Promise<UserNotificationSettingsRecord[]> {
    if (userIds.length === 0) {
      return [];
    }

    return await this.db.query.userNotificationSettings.findMany({
      where: inArray(userNotificationSettings.userId, userIds),
    });
  }

  async upsertUserNotificationSettings(input: {
    userId: number;
    dailyReminderEnabled: boolean;
    dailyReminderHour: number;
    dailyReminderMinute: number;
    timezone: string;
  }): Promise<UserNotificationSettingsRecord> {
    const [record] = await this.db
      .insert(userNotificationSettings)
      .values(input)
      .onConflictDoUpdate({
        target: userNotificationSettings.userId,
        set: {
          dailyReminderEnabled: input.dailyReminderEnabled,
          dailyReminderHour: input.dailyReminderHour,
          dailyReminderMinute: input.dailyReminderMinute,
          timezone: input.timezone,
          updatedAt: new Date(),
        },
      })
      .returning();

    return record;
  }

  async findMembershipForUser(userId: number) {
    return (
      (await this.db.query.workspaceMembers.findFirst({
        where: eq(workspaceMembers.userId, userId),
      })) ?? null
    );
  }

  async findAdminMemberships(workspaceId: number) {
    return await this.db.query.workspaceMembers.findMany({
      where: and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.role, "ADMIN"),
      ),
    });
  }

  async findLeadMeasureReminderTarget(
    workspaceId: number,
    targetUserId: number,
    leadMeasureId: number,
  ) {
    const scoreboard = await this.db.query.scoreboards.findFirst({
      where: and(
        eq(scoreboards.workspaceId, workspaceId),
        eq(scoreboards.userId, targetUserId),
        eq(scoreboards.status, "ACTIVE"),
      ),
      with: {
        leadMeasures: {
          where: eq(leadMeasures.id, leadMeasureId),
        },
      },
    });

    return scoreboard?.leadMeasures[0] ?? null;
  }
}
