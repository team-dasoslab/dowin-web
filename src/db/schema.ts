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
  auditLogs: many(auditLogs),
  ownedWorkspaceBillingStates: many(workspaceBillingState, {
    relationName: "workspaceBillingOwner",
  }),
  requestedBillingCheckoutEvents: many(billingCheckoutEvents),
  marketingInviteRedemptions: many(marketingInviteRedemptions),
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

export const authLoginAttempts = sqliteTable(
  "auth_login_attempts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    customId: text("custom_id").notNull(),
    ipAddress: text("ip_address").notNull().default(""),
    failureCount: integer("failure_count").notNull().default(0),
    firstFailedAt: integer("first_failed_at", { mode: "timestamp" }).notNull(),
    lastFailedAt: integer("last_failed_at", { mode: "timestamp" }).notNull(),
    blockedUntil: integer("blocked_until", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
  },
  (table) => [
    uniqueIndex("auth_login_attempts_custom_id_ip_unique").on(
      table.customId,
      table.ipAddress,
    ),
    index("auth_login_attempts_blocked_until_idx").on(table.blockedUntil),
  ],
);

export const authLoginAttemptsRelations = relations(
  authLoginAttempts,
  () => ({}),
);

export const pendingWorkspaceCheckouts = sqliteTable(
  "pending_workspace_checkouts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    uid: text("uid").notNull().unique(),
    requestId: text("request_id").notNull(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    locale: text("locale", { enum: ["ko", "en"] }).notNull(),
    workspaceName: text("workspace_name").notNull(),
    requestedSeatCount: integer("requested_seat_count").notNull(),
    targetPlanCode: text("target_plan_code", { enum: ["BASIC"] }).notNull(),
    provider: text("provider", { enum: ["POLAR"] }).notNull(),
    providerProductId: text("provider_product_id").notNull(),
    providerCheckoutId: text("provider_checkout_id"),
    checkoutUrl: text("checkout_url"),
    status: text("status", {
      enum: [
        "PENDING",
        "CHECKOUT_CREATED",
        "COMPLETED",
        "EXPIRED",
        "FAILED",
      ],
    })
      .notNull()
      .default("PENDING"),
    completedWorkspaceId: integer("completed_workspace_id").references(
      () => workspaces.id,
      { onDelete: "set null" },
    ),
    completedAt: integer("completed_at", { mode: "timestamp" }),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
  },
  (table) => [
    uniqueIndex("pending_workspace_checkouts_uid_unique").on(table.uid),
    uniqueIndex("pending_workspace_checkouts_request_unique").on(
      table.requestId,
    ),
    index("pending_workspace_checkouts_user_status_idx").on(
      table.userId,
      table.status,
    ),
    index("pending_workspace_checkouts_expires_at_idx").on(table.expiresAt),
  ],
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

export const adminUsers = sqliteTable(
  "admin_users",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    loginId: text("login_id").notNull(),
    passwordHash: text("password_hash").notNull(),
    displayName: text("display_name").notNull(),
    status: text("status", {
      enum: ["ACTIVE", "SUSPENDED", "DISABLED"],
    })
      .notNull()
      .default("ACTIVE"),
    mfaEnabled: integer("mfa_enabled", { mode: "boolean" })
      .notNull()
      .default(false),
    lastLoginAt: integer("last_login_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
  },
  (table) => [
    uniqueIndex("admin_users_login_id_unique").on(table.loginId),
    index("admin_users_status_idx").on(table.status),
  ],
);

export const adminUsersRelations = relations(adminUsers, ({ many }) => ({
  sessions: many(adminSessions),
  roleGrants: many(adminRoleGrants, { relationName: "adminRoleGrantTarget" }),
  grantedRoleGrants: many(adminRoleGrants, {
    relationName: "adminRoleGrantGranter",
  }),
  revokedRoleGrants: many(adminRoleGrants, {
    relationName: "adminRoleGrantRevoker",
  }),
  auditLogs: many(auditLogs),
}));

export const adminSessions = sqliteTable(
  "admin_sessions",
  {
    id: text("id").primaryKey(),
    adminUserId: integer("admin_user_id")
      .notNull()
      .references(() => adminUsers.id, { onDelete: "cascade" }),
    sessionTokenHash: text("session_token_hash").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
    lastAccessedAt: integer("last_accessed_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
  },
  (table) => [
    uniqueIndex("admin_sessions_token_hash_unique").on(table.sessionTokenHash),
    index("admin_sessions_admin_user_idx").on(table.adminUserId),
    index("admin_sessions_expires_at_idx").on(table.expiresAt),
  ],
);

export const adminSessionsRelations = relations(adminSessions, ({ one }) => ({
  adminUser: one(adminUsers, {
    fields: [adminSessions.adminUserId],
    references: [adminUsers.id],
  }),
}));

export const adminRoleGrants = sqliteTable(
  "admin_role_grants",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    adminUserId: integer("admin_user_id")
      .notNull()
      .references(() => adminUsers.id, { onDelete: "cascade" }),
    role: text("role", {
      enum: [
        "SUPPORT_ADMIN",
        "BILLING_ADMIN",
        "RECOVERY_ADMIN",
        "SYSTEM_ADMIN",
      ],
    }).notNull(),
    grantedByAdminUserId: integer("granted_by_admin_user_id").references(
      () => adminUsers.id,
      { onDelete: "set null" },
    ),
    grantReason: text("grant_reason"),
    grantedAt: integer("granted_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
    revokedAt: integer("revoked_at", { mode: "timestamp" }),
    revokedByAdminUserId: integer("revoked_by_admin_user_id").references(
      () => adminUsers.id,
      { onDelete: "set null" },
    ),
    revokeReason: text("revoke_reason"),
  },
  (table) => [
    index("admin_role_grants_admin_user_idx").on(table.adminUserId),
    index("admin_role_grants_role_idx").on(table.role),
    index("admin_role_grants_active_lookup_idx").on(
      table.adminUserId,
      table.role,
      table.revokedAt,
    ),
  ],
);

export const adminRoleGrantsRelations = relations(
  adminRoleGrants,
  ({ one }) => ({
    adminUser: one(adminUsers, {
      relationName: "adminRoleGrantTarget",
      fields: [adminRoleGrants.adminUserId],
      references: [adminUsers.id],
    }),
    grantedByAdminUser: one(adminUsers, {
      relationName: "adminRoleGrantGranter",
      fields: [adminRoleGrants.grantedByAdminUserId],
      references: [adminUsers.id],
    }),
    revokedByAdminUser: one(adminUsers, {
      relationName: "adminRoleGrantRevoker",
      fields: [adminRoleGrants.revokedByAdminUserId],
      references: [adminUsers.id],
    }),
  }),
);

export const devicePushTokens = sqliteTable(
  "device_push_tokens",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: text("provider", { enum: ["FCM"] })
      .notNull()
      .default("FCM"),
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
  uid: text("uid").unique(),
  name: text("name").notNull(),
  planCode: text("plan_code", { enum: ["BASIC", "FREE", "STANDARD"] })
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
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
});

export const workspacesRelations = relations(workspaces, ({ many }) => ({
  members: many(workspaceMembers),
  scoreboards: many(scoreboards),
  tags: many(workspaceTags),
  invites: many(workspaceInvites),
  marketingInviteRedemptions: many(marketingInviteRedemptions),
  teamMemos: many(teamMemos),
  contactInquiries: many(contactInquiries),
  auditLogs: many(auditLogs),
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
    planCode: text("plan_code", { enum: ["BASIC", "STANDARD"] }).notNull(),
    providerProductId: text("provider_product_id").notNull(),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
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
  planCode: text("plan_code", { enum: ["BASIC", "FREE", "STANDARD"] }).primaryKey(),
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

export const billingRetentionRecords = sqliteTable(
  "billing_retention_records",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    uid: text("uid").notNull().unique(),
    provider: text("provider", { enum: ["POLAR"] }).notNull(),
    providerEventId: text("provider_event_id"),
    billingEventId: integer("billing_event_id").references(() => billingEvents.id, {
      onDelete: "set null",
    }),
    eventType: text("event_type").notNull(),
    eventOccurredAt: integer("event_occurred_at", {
      mode: "timestamp",
    }).notNull(),
    workspaceIdSnapshot: integer("workspace_id_snapshot"),
    workspaceUidSnapshot: text("workspace_uid_snapshot"),
    workspaceNameSnapshot: text("workspace_name_snapshot"),
    billingOwnerUserIdSnapshot: integer("billing_owner_user_id_snapshot"),
    planCode: text("plan_code", { enum: ["BASIC", "FREE", "STANDARD"] })
      .notNull()
      .default("BASIC"),
    productCode: text("product_code"),
    billingInterval: text("billing_interval"),
    seatCount: integer("seat_count"),
    unitPrice: integer("unit_price"),
    currency: text("currency"),
    amount: integer("amount"),
    taxAmount: integer("tax_amount"),
    taxRate: text("tax_rate"),
    taxJurisdiction: text("tax_jurisdiction"),
    customerKey: text("customer_key"),
    subscriptionKey: text("subscription_key"),
    checkoutId: text("checkout_id"),
    orderId: text("order_id"),
    invoiceId: text("invoice_id"),
    paymentId: text("payment_id"),
    receiptUrl: text("receipt_url"),
    currentPeriodStart: integer("current_period_start", { mode: "timestamp" }),
    currentPeriodEnd: integer("current_period_end", { mode: "timestamp" }),
    paidAt: integer("paid_at", { mode: "timestamp" }),
    refundedAt: integer("refunded_at", { mode: "timestamp" }),
    canceledAt: integer("canceled_at", { mode: "timestamp" }),
    termsVersion: text("terms_version"),
    privacyPolicyVersion: text("privacy_policy_version"),
    billingPolicyVersion: text("billing_policy_version"),
    checkoutNoticeVersion: text("checkout_notice_version"),
    autoRenewalNoticeAcceptedAt: integer("auto_renewal_notice_accepted_at", {
      mode: "timestamp",
    }),
    ipCountry: text("ip_country"),
    billingCountry: text("billing_country"),
    taxEvidenceSource: text("tax_evidence_source"),
    normalizedPayloadJson: text("normalized_payload_json").notNull(),
    legalRetentionUntil: integer("legal_retention_until", {
      mode: "timestamp",
    }).notNull(),
    legalHold: integer("legal_hold", { mode: "boolean" })
      .notNull()
      .default(false),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
  },
  (table) => [
    uniqueIndex("billing_retention_records_provider_event_unique").on(
      table.provider,
      table.providerEventId,
      table.eventType,
    ),
    index("billing_retention_records_workspace_idx").on(
      table.workspaceIdSnapshot,
    ),
    index("billing_retention_records_retention_until_idx").on(
      table.legalRetentionUntil,
    ),
  ],
);

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
      enum: ["BASIC", "FREE", "STANDARD"],
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
  provider: text("provider", { enum: ["POLAR"] }),
  billingStatus: text("billing_status", {
    enum: ["NONE", "ACTIVE", "CANCELED", "EXPIRED", "REVOKED"],
  })
    .notNull()
    .default("NONE"),
  planCode: text("plan_code", { enum: ["BASIC", "FREE", "STANDARD"] })
    .notNull()
    .default("FREE"),
  entitlementSource: text("entitlement_source", {
    enum: [
      "POLAR",
      "MANUAL_GRANT",
      "PARTNER",
      "INTERNAL_TEST",
      "BETA_PROMOTIONAL_GRANT",
    ],
  }),
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

export const workspaceSeatEntitlements = sqliteTable(
  "workspace_seat_entitlements",
  {
    workspaceId: integer("workspace_id")
      .primaryKey()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    planCode: text("plan_code", { enum: ["BASIC"] }).notNull(),
    purchasedSeatCount: integer("purchased_seat_count").notNull(),
    seatSource: text("seat_source", {
      enum: ["POLAR", "MANUAL_GRANT", "BETA_PROMOTIONAL_GRANT"],
    }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
  },
);

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
  (table) => [
    uniqueIndex("workspace_members_workspace_user_unique").on(
      table.workspaceId,
      table.userId,
    ),
  ],
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

export const marketingInviteCodes = sqliteTable(
  "marketing_invite_codes",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    code: text("code").notNull(),
    campaignName: text("campaign_name").notNull(),
    description: text("description"),
    maxUses: integer("max_uses").notNull(),
    usedCount: integer("used_count").notNull().default(0),
    grantedSeatCount: integer("granted_seat_count").notNull(),
    entitlementSource: text("entitlement_source", {
      enum: ["BETA_PROMOTIONAL_GRANT"],
    })
      .notNull()
      .default("BETA_PROMOTIONAL_GRANT"),
    status: text("status", { enum: ["ACTIVE", "INACTIVE"] })
      .notNull()
      .default("ACTIVE"),
    createdByAdminUserId: integer("created_by_admin_user_id")
      .notNull()
      .references(() => adminUsers.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
  },
  (table) => [
    uniqueIndex("marketing_invite_codes_code_unique").on(table.code),
    index("marketing_invite_codes_status_idx").on(table.status),
    index("marketing_invite_codes_created_by_admin_idx").on(
      table.createdByAdminUserId,
    ),
  ],
);

export const marketingInviteCodesRelations = relations(
  marketingInviteCodes,
  ({ one, many }) => ({
    createdByAdminUser: one(adminUsers, {
      fields: [marketingInviteCodes.createdByAdminUserId],
      references: [adminUsers.id],
    }),
    redemptions: many(marketingInviteRedemptions),
  }),
);

export const marketingInviteRedemptions = sqliteTable(
  "marketing_invite_redemptions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    marketingInviteCodeId: integer("marketing_invite_code_id")
      .notNull()
      .references(() => marketingInviteCodes.id, { onDelete: "cascade" }),
    redeemedByUserId: integer("redeemed_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    workspaceId: integer("workspace_id").references(() => workspaces.id, {
      onDelete: "set null",
    }),
    redeemedAt: integer("redeemed_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
    feedbackStatus: text("feedback_status", {
      enum: ["NOT_REQUESTED", "REQUESTED", "RECEIVED", "DROPPED"],
    })
      .notNull()
      .default("NOT_REQUESTED"),
    acquisitionSource: text("acquisition_source", {
      enum: ["MARKETING_INVITE"],
    })
      .notNull()
      .default("MARKETING_INVITE"),
    campaignName: text("campaign_name").notNull(),
    operatorNote: text("operator_note"),
  },
  (table) => [
    uniqueIndex("marketing_invite_redemptions_code_user_unique").on(
      table.marketingInviteCodeId,
      table.redeemedByUserId,
    ),
    uniqueIndex("marketing_invite_redemptions_workspace_unique").on(
      table.workspaceId,
    ),
    index("marketing_invite_redemptions_code_idx").on(
      table.marketingInviteCodeId,
    ),
    index("marketing_invite_redemptions_user_idx").on(table.redeemedByUserId),
  ],
);

export const marketingInviteRedemptionsRelations = relations(
  marketingInviteRedemptions,
  ({ one }) => ({
    inviteCode: one(marketingInviteCodes, {
      fields: [marketingInviteRedemptions.marketingInviteCodeId],
      references: [marketingInviteCodes.id],
    }),
    redeemedByUser: one(users, {
      fields: [marketingInviteRedemptions.redeemedByUserId],
      references: [users.id],
    }),
    workspace: one(workspaces, {
      fields: [marketingInviteRedemptions.workspaceId],
      references: [workspaces.id],
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
  trackingMode: text("tracking_mode", { enum: ["BOOLEAN", "COUNT"] })
    .notNull()
    .default("BOOLEAN"),
  dailyTargetCount: integer("daily_target_count").notNull().default(1),
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
    count: integer("count").notNull().default(1),
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

export const auditLogs = sqliteTable(
  "audit_logs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    actorType: text("actor_type", { enum: ["USER", "ADMIN"] }).notNull(),
    actorUserId: integer("actor_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    actorAdminUserId: integer("actor_admin_user_id").references(
      () => adminUsers.id,
      { onDelete: "set null" },
    ),
    workspaceId: integer("workspace_id").references(() => workspaces.id, {
      onDelete: "set null",
    }),
    entityType: text("entity_type", {
      enum: [
        "WORKSPACE",
        "WORKSPACE_MEMBER",
        "WORKSPACE_INVITE",
        "WORKSPACE_TAG",
        "SCOREBOARD",
        "LEAD_MEASURE",
        "DAILY_LOG",
        "TEAM_MEMO",
        "USER",
        "CONTACT_INQUIRY",
        "MARKETING_INVITE_CODE",
        "MARKETING_INVITE_REDEMPTION",
        "ADMIN_USER",
        "ADMIN_ROLE_GRANT",
        "BILLING_PROVIDER_PRODUCT",
      ],
    }).notNull(),
    entityId: integer("entity_id"),
    actionType: text("action_type", {
      enum: [
        "CREATE",
        "UPDATE",
        "DELETE",
        "ARCHIVE",
        "REACTIVATE",
        "RESTORE",
        "REMOVE_MEMBER",
        "LEAVE_WORKSPACE",
        "TRANSFER_ADMIN",
        "STATUS_CHANGE",
        "GRANT_ROLE",
        "REVOKE_ROLE",
      ],
    }).notNull(),
    metadata: text("metadata"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(strftime('%s', 'now'))`),
  },
  (table) => [
    index("audit_logs_workspace_created_idx").on(
      table.workspaceId,
      table.createdAt,
    ),
    index("audit_logs_entity_created_idx").on(
      table.entityType,
      table.entityId,
      table.createdAt,
    ),
    index("audit_logs_actor_user_created_idx").on(
      table.actorUserId,
      table.createdAt,
    ),
    index("audit_logs_actor_admin_created_idx").on(
      table.actorAdminUserId,
      table.createdAt,
    ),
    index("audit_logs_actor_type_created_idx").on(
      table.actorType,
      table.createdAt,
    ),
  ],
);

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  actorUser: one(users, {
    fields: [auditLogs.actorUserId],
    references: [users.id],
  }),
  actorAdminUser: one(adminUsers, {
    fields: [auditLogs.actorAdminUserId],
    references: [adminUsers.id],
  }),
  workspace: one(workspaces, {
    fields: [auditLogs.workspaceId],
    references: [workspaces.id],
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
    locale: text("locale", { enum: ["ko", "en"] })
      .notNull()
      .default("ko"),
    source: text("source", { enum: ["CONTACT_PAGE"] })
      .notNull()
      .default("CONTACT_PAGE"),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    workspaceId: integer("workspace_id").references(() => workspaces.id, {
      onDelete: "set null",
    }),
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
