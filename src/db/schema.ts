import { relations, sql } from "drizzle-orm";
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customId: text("custom_id").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  nickname: text("nickname").notNull(),
  avatarKey: text("avatar_key"),
  isFirstLogin: integer("is_first_login", { mode: "boolean" })
    .notNull()
    .default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
});

export const usersRelations = relations(users, ({ many }) => ({
  members: many(workspaceMembers),
  scoreboards: many(scoreboards),
  recoveryCodes: many(authRecoveryCodes),
}));

export const authRecoveryCodes = sqliteTable("auth_recovery_codes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  codeHash: text("code_hash").notNull().unique(),
  usedAt: integer("used_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
});

export const authRecoveryCodesRelations = relations(authRecoveryCodes, ({ one }) => ({
  user: one(users, {
    fields: [authRecoveryCodes.userId],
    references: [users.id],
  }),
}));

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(), // nanoid
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
});

export const pushSubscriptions = sqliteTable("push_subscriptions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
});

export const workspaces = sqliteTable("workspaces", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
});

export const workspacesRelations = relations(workspaces, ({ many }) => ({
  members: many(workspaceMembers),
  scoreboards: many(scoreboards),
  invites: many(workspaceInvites),
}));

export const workspaceMembers = sqliteTable(
  "workspace_members",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    workspaceId: integer("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["ADMIN", "MEMBER"] })
      .notNull()
      .default("MEMBER"),
    privacyLevel: text("privacy_level", {
      enum: ["PUBLIC", "SUMMARY", "PRIVATE"],
    })
      .notNull()
      .default("PUBLIC"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
  },
  (table) => [uniqueIndex("workspace_members_user_unique").on(table.userId)],
);

export const workspaceMembersRelations = relations(workspaceMembers, ({ one }) => ({
  user: one(users, {
    fields: [workspaceMembers.userId],
    references: [users.id],
  }),
  workspace: one(workspaces, {
    fields: [workspaceMembers.workspaceId],
    references: [workspaces.id],
  }),
}));

export const workspaceInvites = sqliteTable("workspace_invites", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  workspaceId: integer("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  code: text("code").notNull().unique(),
  maxUses: integer("max_uses").notNull(),
  usedCount: integer("used_count").notNull().default(0),
  status: text("status", { enum: ["ACTIVE", "INACTIVE"] })
    .notNull()
    .default("ACTIVE"),
  createdByUserId: integer("created_by_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
});

export const workspaceInvitesRelations = relations(workspaceInvites, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [workspaceInvites.workspaceId],
    references: [workspaces.id],
  }),
  createdByUser: one(users, {
    fields: [workspaceInvites.createdByUserId],
    references: [users.id],
  }),
}));

export const scoreboards = sqliteTable(
  "scoreboards",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    workspaceId: integer("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    goalName: text("goal_name").notNull(),
    lagMeasure: text("lag_measure").notNull(),
    status: text("status", { enum: ["ACTIVE", "ARCHIVED"] })
      .notNull()
      .default("ACTIVE"),
    startDate: text("start_date").notNull(),
    endDate: text("end_date"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
  },
  (table) => [
    uniqueIndex("idx_active_scoreboard")
      .on(table.userId, table.workspaceId)
      .where(sql`${table.status} = 'ACTIVE'`),
  ],
);

export const scoreboardsRelations = relations(scoreboards, ({ one, many }) => ({
  user: one(users, {
    fields: [scoreboards.userId],
    references: [users.id],
  }),
  workspace: one(workspaces, {
    fields: [scoreboards.workspaceId],
    references: [workspaces.id],
  }),
  leadMeasures: many(leadMeasures),
}));

export const leadMeasures = sqliteTable("lead_measures", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  scoreboardId: integer("scoreboard_id")
    .notNull()
    .references(() => scoreboards.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  targetValue: integer("target_value").notNull().default(1),
  period: text("period", { enum: ["DAILY", "WEEKLY", "MONTHLY"] })
    .notNull()
    .default("DAILY"),
  status: text("status", { enum: ["ACTIVE", "ARCHIVED"] })
    .notNull()
    .default("ACTIVE"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
  archivedAt: integer("archived_at", { mode: "timestamp" }),
});

export const leadMeasuresRelations = relations(leadMeasures, ({ one, many }) => ({
  scoreboard: one(scoreboards, {
    fields: [leadMeasures.scoreboardId],
    references: [scoreboards.id],
  }),
  dailyLogs: many(dailyLogs),
}));

export const dailyLogs = sqliteTable(
  "daily_logs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    leadMeasureId: integer("lead_measure_id")
      .notNull()
      .references(() => leadMeasures.id, { onDelete: "cascade" }),
    logDate: text("log_date").notNull(),
    value: integer("value", { mode: "boolean" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
  },
  (table) => [
    uniqueIndex("daily_logs_lead_measure_date_unique").on(
      table.leadMeasureId,
      table.logDate,
    ),
  ],
);

export const dailyLogsRelations = relations(dailyLogs, ({ one }) => ({
  leadMeasure: one(leadMeasures, {
    fields: [dailyLogs.leadMeasureId],
    references: [leadMeasures.id],
  }),
}));
