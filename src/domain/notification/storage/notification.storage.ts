import { getDb } from "@/db";
import {
  devicePushTokens,
  leadMeasures,
  scoreboards,
  userNotificationSettings,
  workspaceMembers,
} from "@/db/schema";
import { and, eq, inArray, isNull } from "drizzle-orm";

type Db = ReturnType<typeof getDb>;
export type DevicePushTokenRecord = typeof devicePushTokens.$inferSelect;
export type DevicePushTokenWithLocaleRecord = DevicePushTokenRecord & {
  user: {
    locale: string | null;
  };
};
export type UserNotificationSettingsRecord =
  typeof userNotificationSettings.$inferSelect;
export type UserNotificationSettingsWithLocale =
  UserNotificationSettingsRecord & {
    user: {
      locale: string;
    };
  };

export class NotificationStorage {
  constructor(private db: Db) {}

  async upsertDevicePushToken(input: {
    userId: number;
    provider: "FCM";
    platform: "IOS" | "ANDROID";
    token: string;
    appVersion?: string | null;
    notificationEnabled: boolean;
  }): Promise<void> {
    await this.db
      .insert(devicePushTokens)
      .values({
        userId: input.userId,
        provider: input.provider,
        platform: input.platform,
        token: input.token,
        appVersion: input.appVersion ?? null,
        notificationEnabled: input.notificationEnabled,
        lastSeenAt: new Date(),
        disabledAt: input.notificationEnabled ? null : new Date(),
      })
      .onConflictDoUpdate({
        target: devicePushTokens.token,
        set: {
          userId: input.userId,
          provider: input.provider,
          platform: input.platform,
          appVersion: input.appVersion ?? null,
          notificationEnabled: input.notificationEnabled,
          lastSeenAt: new Date(),
          disabledAt: input.notificationEnabled ? null : new Date(),
          updatedAt: new Date(),
        },
      });
  }

  async disableDevicePushTokenForUser(
    userId: number,
    token: string,
  ): Promise<void> {
    await this.db
      .update(devicePushTokens)
      .set({
        notificationEnabled: false,
        disabledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(devicePushTokens.userId, userId),
          eq(devicePushTokens.token, token),
        ),
      );
  }

  async disableDevicePushTokens(tokens: string[]): Promise<void> {
    if (tokens.length === 0) {
      return;
    }

    await this.db
      .update(devicePushTokens)
      .set({
        notificationEnabled: false,
        disabledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(inArray(devicePushTokens.token, tokens));
  }

  async findAllActiveDevicePushTokens(): Promise<DevicePushTokenRecord[]> {
    return await this.db
      .select()
      .from(devicePushTokens)
      .where(
        and(
          eq(devicePushTokens.notificationEnabled, true),
          isNull(devicePushTokens.disabledAt),
        ),
      );
  }

  async findAllActiveDevicePushTokensWithLocale(): Promise<
    DevicePushTokenWithLocaleRecord[]
  > {
    return (await this.db.query.devicePushTokens.findMany({
      where: and(
        eq(devicePushTokens.notificationEnabled, true),
        isNull(devicePushTokens.disabledAt),
      ),
      with: {
        user: {
          columns: {
            locale: true,
          },
        },
      },
    })) as DevicePushTokenWithLocaleRecord[];
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
  ): Promise<UserNotificationSettingsWithLocale[]> {
    if (userIds.length === 0) {
      return [];
    }

    return (await this.db.query.userNotificationSettings.findMany({
      where: inArray(userNotificationSettings.userId, userIds),
      with: {
        user: {
          columns: {
            locale: true,
          },
        },
      },
    })) as UserNotificationSettingsWithLocale[];
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

  async findMembershipForUser(userId: number, workspaceId?: number) {
    const membership = workspaceId
      ? await this.db.query.workspaceMembers.findFirst({
          where: and(
            eq(workspaceMembers.userId, userId),
            eq(workspaceMembers.workspaceId, workspaceId),
          ),
        })
      : null;

    if (membership) {
      return membership;
    }

    return (
      (await this.db.query.workspaceMembers.findFirst({
        where: eq(workspaceMembers.userId, userId),
        orderBy: (members, { asc }) => [asc(members.createdAt), asc(members.id)],
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
