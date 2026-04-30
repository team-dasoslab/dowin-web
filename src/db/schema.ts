import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customId: text("custom_id").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  nickname: text("nickname").notNull(),
  avatarKey: text("avatar_key"),
  isFirstLogin: integer("is_first_login", { mode: "boolean" })
    .notNull()
    .default(true),
  locale: text("locale").notNull().default("ko"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
});

export const usersRelations = relations(users, ({ many }) => ({
  members: many(workspaceMembers),
  scoreboards: many(scoreboards),
  recoveryCodes: many(authRecoveryCodes),
  createdWorkspaceTags: many(workspaceTags),
  authoredTeamMemos: many(teamMemos, { relationName: "teamMemoAuthor" }),
  targetedTeamMemos: many(teamMemos, { relationName: "teamMemoTarget" }),
  resolvedTeamMemos: many(teamMemos, { relationName: "teamMemoResolver" }),
  contactInquiries: many(contactInquiries),
  notificationSettings: many(userNotificationSettings),
  devicePushTokens: many(devicePushTokens),
  ownedWorkspaceBillingStates: many(workspaceBillingState, {
    relationName: "workspaceBillingOwner",
  }),
  requestedBillingCheckoutEvents: many(billingCheckoutEvents),
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

export const authRecoveryCodesRelations = relations(
  authRecoveryCodes,
  ({ one }) => ({
    user: one(users, {
      fields: [authRecoveryCodes.userId],
      references: [users.id],
    }),
  }),
);

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

export const devicePushTokens = sqliteTable(
  "device_push_tokens",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: text("provider", { enum: ["FCM"] }).notNull().default("FCM"),
    platform: text("platform", { enum: ["IOS", "ANDROID"] }).notNull(),
    token: text("token").notNull(),
    appVersion: text("app_version"),
    notificationEnabled: integer("notification_enabled", { mode: "boolean" })
      .notNull()
      .default(true),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
    lastSeenAt: integer("last_seen_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
    disabledAt: integer("disabled_at", { mode: "timestamp" }),
  },
  (table) => [
    uniqueIndex("device_push_tokens_token_unique").on(table.token),
    index("device_push_tokens_user_idx").on(table.userId),
  ],
);

export const devicePushTokensRelations = relations(
  devicePushTokens,
  ({ one }) => ({
    user: one(users, {
      fields: [devicePushTokens.userId],
      references: [users.id],
    }),
  }),
);

export const workspaces = sqliteTable("workspaces", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  planCode: text("plan_code", { enum: ["FREE", "STANDARD"] })
    .notNull()
    .default("FREE"),
  billingCustomerExternalRef: text("billing_customer_external_ref"),
  billingOwnerUserId: integer("billing_owner_user_id").references(
    () => users.id,
    { onDelete: "set null" },
  ),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
});

export const workspacesRelations = relations(workspaces, ({ many }) => ({
  members: many(workspaceMembers),
  scoreboards: many(scoreboards),
  tags: many(workspaceTags),
  invites: many(workspaceInvites),
  teamMemos: many(teamMemos),
  contactInquiries: many(contactInquiries),
  billingEvents: many(billingEvents),
  billingCheckoutEvents: many(billingCheckoutEvents),
  billingStates: many(workspaceBillingState),
}));

export const billingProviderProducts = sqliteTable(
  "billing_provider_products",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    provider: text("provider", { enum: ["POLAR"] }).notNull(),
    environment: text("environment", {
      enum: ["sandbox", "production"],
    }).notNull(),
    planCode: text("plan_code", { enum: ["STANDARD"] }).notNull(),
    providerProductId: text("provider_product_id").notNull(),
    isActive: integer("is_active", { mode: "boolean" })
      .notNull()
      .default(true),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
  },
  (table) => [
    uniqueIndex("billing_provider_products_provider_env_plan_unique").on(
      table.provider,
      table.environment,
      table.planCode,
    ),
  ],
);

export const billingPlanLimits = sqliteTable("billing_plan_limits", {
  planCode: text("plan_code", { enum: ["FREE", "STANDARD"] }).primaryKey(),
  memberLimit: integer("member_limit").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
});

export const billingEvents = sqliteTable(
  "billing_events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    workspaceId: integer("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    provider: text("provider", { enum: ["POLAR"] }).notNull(),
    providerEventId: text("provider_event_id"),
    eventType: text("event_type").notNull(),
    subscriptionKey: text("subscription_key"),
    customerKey: text("customer_key"),
    occurredAt: integer("occurred_at", { mode: "timestamp" }).notNull(),
    recordedAt: integer("recorded_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
    payloadJson: text("payload_json"),
    status: text("status", { enum: ["ACCEPTED", "IGNORED", "FAILED"] })
      .notNull()
      .default("ACCEPTED"),
    failureReason: text("failure_reason"),
    source: text("source", {
      enum: ["WEBHOOK", "RECONCILIATION", "MANUAL_CORRECTION"],
    })
      .notNull()
      .default("WEBHOOK"),
  },
  (table) => [
    uniqueIndex("billing_events_provider_event_unique").on(
      table.provider,
      table.providerEventId,
    ),
  ],
);

export const billingEventsRelations = relations(billingEvents, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [billingEvents.workspaceId],
    references: [workspaces.id],
  }),
}));

export const billingCheckoutEvents = sqliteTable(
  "billing_checkout_events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    workspaceId: integer("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    requestedByUserId: integer("requested_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    requestId: text("request_id").notNull(),
    targetPlanCode: text("target_plan_code", {
      enum: ["FREE", "STANDARD"],
    }).notNull(),
    provider: text("provider", { enum: ["POLAR"] }).notNull(),
    providerCheckoutId: text("provider_checkout_id"),
    eventType: text("event_type").notNull(),
    occurredAt: integer("occurred_at", { mode: "timestamp" }).notNull(),
    recordedAt: integer("recorded_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
    payloadJson: text("payload_json"),
  },
  (table) => [
    uniqueIndex("billing_checkout_events_workspace_request_event_unique").on(
      table.workspaceId,
      table.requestId,
      table.eventType,
    ),
  ],
);

export const billingCheckoutEventsRelations = relations(
  billingCheckoutEvents,
  ({ one }) => ({
    workspace: one(workspaces, {
      fields: [billingCheckoutEvents.workspaceId],
      references: [workspaces.id],
    }),
    requestedByUser: one(users, {
      fields: [billingCheckoutEvents.requestedByUserId],
      references: [users.id],
    }),
  }),
);

export const workspaceBillingState = sqliteTable("workspace_billing_state", {
  workspaceId: integer("workspace_id")
    .primaryKey()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  provider: text("provider", { enum: ["POLAR"] }).notNull(),
  billingStatus: text("billing_status", {
    enum: ["NONE", "ACTIVE", "CANCELED", "EXPIRED", "REVOKED"],
  })
    .notNull()
    .default("NONE"),
  planCode: text("plan_code", { enum: ["FREE", "STANDARD"] })
    .notNull()
    .default("FREE"),
  customerKey: text("customer_key"),
  subscriptionKey: text("subscription_key"),
  currentPeriodEnd: integer("current_period_end", { mode: "timestamp" }),
  cancelAtPeriodEnd: integer("cancel_at_period_end", { mode: "boolean" })
    .notNull()
    .default(false),
  billingOwnerUserId: integer("billing_owner_user_id").references(
    () => users.id,
    { onDelete: "set null" },
  ),
  lastEventId: integer("last_event_id").references(() => billingEvents.id, {
    onDelete: "set null",
  }),
  lastEventOccurredAt: integer("last_event_occurred_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
});

export const workspaceBillingStateRelations = relations(
  workspaceBillingState,
  ({ one }) => ({
    workspace: one(workspaces, {
      fields: [workspaceBillingState.workspaceId],
      references: [workspaces.id],
    }),
    billingOwnerUser: one(users, {
      relationName: "workspaceBillingOwner",
      fields: [workspaceBillingState.billingOwnerUserId],
      references: [users.id],
    }),
    lastEvent: one(billingEvents, {
      fields: [workspaceBillingState.lastEventId],
      references: [billingEvents.id],
    }),
  }),
);

export const userNotificationSettings = sqliteTable(
  "user_notification_settings",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    dailyReminderEnabled: integer("daily_reminder_enabled", {
      mode: "boolean",
    })
      .notNull()
      .default(false),
    dailyReminderHour: integer("daily_reminder_hour").notNull().default(21),
    dailyReminderMinute: integer("daily_reminder_minute").notNull().default(0),
    timezone: text("timezone").notNull().default("Asia/Seoul"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
  },
  (table) => [
    uniqueIndex("user_notification_settings_user_unique").on(table.userId),
  ],
);

export const userNotificationSettingsRelations = relations(
  userNotificationSettings,
  ({ one }) => ({
    user: one(users, {
      fields: [userNotificationSettings.userId],
      references: [users.id],
    }),
  }),
);

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

export const workspaceMembersRelations = relations(
  workspaceMembers,
  ({ one }) => ({
    user: one(users, {
      fields: [workspaceMembers.userId],
      references: [users.id],
    }),
    workspace: one(workspaces, {
      fields: [workspaceMembers.workspaceId],
      references: [workspaces.id],
    }),
  }),
);

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

export const workspaceInvitesRelations = relations(
  workspaceInvites,
  ({ one }) => ({
    workspace: one(workspaces, {
      fields: [workspaceInvites.workspaceId],
      references: [workspaces.id],
    }),
    createdByUser: one(users, {
      fields: [workspaceInvites.createdByUserId],
      references: [users.id],
    }),
  }),
);

export const workspaceTags = sqliteTable(
  "workspace_tags",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    workspaceId: integer("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    normalizedName: text("normalized_name").notNull(),
    createdByUserId: integer("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
  },
  (table) => [
    uniqueIndex("workspace_tags_workspace_normalized_name_unique").on(
      table.workspaceId,
      table.normalizedName,
    ),
  ],
);

export const workspaceTagsRelations = relations(
  workspaceTags,
  ({ one, many }) => ({
    workspace: one(workspaces, {
      fields: [workspaceTags.workspaceId],
      references: [workspaces.id],
    }),
    createdByUser: one(users, {
      fields: [workspaceTags.createdByUserId],
      references: [users.id],
    }),
    leadMeasureTags: many(leadMeasureTags),
  }),
);

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

export const leadMeasuresRelations = relations(
  leadMeasures,
  ({ one, many }) => ({
    scoreboard: one(scoreboards, {
      fields: [leadMeasures.scoreboardId],
      references: [scoreboards.id],
    }),
    dailyLogs: many(dailyLogs),
    tags: many(leadMeasureTags),
  }),
);

export const leadMeasureTags = sqliteTable(
  "lead_measure_tags",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    leadMeasureId: integer("lead_measure_id")
      .notNull()
      .references(() => leadMeasures.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => workspaceTags.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
  },
  (table) => [
    uniqueIndex("lead_measure_tags_measure_tag_unique").on(
      table.leadMeasureId,
      table.tagId,
    ),
  ],
);

export const leadMeasureTagsRelations = relations(
  leadMeasureTags,
  ({ one }) => ({
    leadMeasure: one(leadMeasures, {
      fields: [leadMeasureTags.leadMeasureId],
      references: [leadMeasures.id],
    }),
    tag: one(workspaceTags, {
      fields: [leadMeasureTags.tagId],
      references: [workspaceTags.id],
    }),
  }),
);

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

export const teamMemos = sqliteTable("team_memos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  workspaceId: integer("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  targetUserId: integer("target_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  authorUserId: integer("author_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  resolvedAt: integer("resolved_at", { mode: "timestamp" }),
  resolvedByUserId: integer("resolved_by_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
});

export const teamMemosRelations = relations(teamMemos, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [teamMemos.workspaceId],
    references: [workspaces.id],
  }),
  targetUser: one(users, {
    relationName: "teamMemoTarget",
    fields: [teamMemos.targetUserId],
    references: [users.id],
  }),
  authorUser: one(users, {
    relationName: "teamMemoAuthor",
    fields: [teamMemos.authorUserId],
    references: [users.id],
  }),
  resolvedByUser: one(users, {
    relationName: "teamMemoResolver",
    fields: [teamMemos.resolvedByUserId],
    references: [users.id],
  }),
}));

export const contactInquiries = sqliteTable(
  "contact_inquiries",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    category: text("category", {
      enum: ["GENERAL", "BILLING", "BUG_OR_ACCOUNT"],
    }).notNull(),
    status: text("status", {
      enum: ["RECEIVED", "IN_PROGRESS", "RESOLVED"],
    })
      .notNull()
      .default("RECEIVED"),
    subject: text("subject").notNull(),
    message: text("message").notNull(),
    replyEmail: text("reply_email").notNull(),
    consentedAt: integer("consented_at", { mode: "timestamp" }).notNull(),
    locale: text("locale", { enum: ["ko", "en"] }).notNull().default("ko"),
    source: text("source", { enum: ["CONTACT_PAGE"] })
      .notNull()
      .default("CONTACT_PAGE"),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    workspaceId: integer("workspace_id").references(() => workspaces.id, {
      onDelete: "set null",
    }),
    discordDeliveryStatus: text("discord_delivery_status", {
      enum: ["PENDING", "SENT", "FAILED"],
    })
      .notNull()
      .default("PENDING"),
    discordFailureReason: text("discord_failure_reason"),
    discordDeliveredAt: integer("discord_delivered_at", { mode: "timestamp" }),
    answerSummary: text("answer_summary"),
    answeredAt: integer("answered_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
  },
  (table) => [
    index("contact_inquiries_user_idx").on(table.userId),
    index("contact_inquiries_workspace_idx").on(table.workspaceId),
    index("contact_inquiries_created_at_idx").on(table.createdAt),
  ],
);

export const contactInquiriesRelations = relations(
  contactInquiries,
  ({ one }) => ({
    user: one(users, {
      fields: [contactInquiries.userId],
      references: [users.id],
    }),
    workspace: one(workspaces, {
      fields: [contactInquiries.workspaceId],
      references: [workspaces.id],
    }),
  }),
);
