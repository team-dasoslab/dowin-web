import { getDb } from "@/db";
import {
  basicUsageEvents,
  dailyLogs,
  devicePushTokens,
  leadMeasures,
  scoreboards,
  teamCheckinAdjustmentAuditLogs,
  teamCheckinAdjustmentProposals,
  teamCheckinDeliveries,
  teamCheckinResponses,
  userNotificationSettings,
  users,
  workspaceBillingState,
  workspaceMembers,
  workspaceTeamCheckinSettings,
  workspaces,
} from "@/db/schema";
import {
  BASIC_OPERATIONAL_BILLING_STATUSES,
  BASIC_OPERATIONAL_PLAN_CODES,
} from "@/domain/billing/entitlement-policy";
import { and, desc, eq, gte, inArray, isNull, lte, sql } from "drizzle-orm";

type Db = ReturnType<typeof getDb>;

export type TeamCheckinSettingsRecord = typeof workspaceTeamCheckinSettings.$inferSelect;
export type TeamCheckinDeliveryRecord = typeof teamCheckinDeliveries.$inferSelect;
export type TeamCheckinResponseRecord = typeof teamCheckinResponses.$inferSelect;
export type TeamCheckinAdjustmentProposalRecord =
  typeof teamCheckinAdjustmentProposals.$inferSelect;
export type TeamCheckinAdjustmentActionType = TeamCheckinAdjustmentProposalRecord["actionType"];
export type TeamCheckinResponseType = TeamCheckinResponseRecord["responseType"];
export type TeamCheckinDeliveryReasonCode = TeamCheckinDeliveryRecord["reasonCode"];

export type TeamCheckinCandidate = {
  workspaceId: number;
  workspaceUid: string;
  memberUserId: number;
  memberRole: "ADMIN" | "MEMBER";
  userLocale: string | null;
  timezone: string | null;
  scoreboardId: number;
  leadMeasureId: number;
  leadMeasureName: string;
  leadMeasureCreatedAt: Date;
  targetValue: number;
  period: "DAILY" | "WEEKLY" | "MONTHLY";
  trackingMode: "BOOLEAN" | "COUNT";
  dailyTargetCount: number;
};

export type TeamCheckinReportRow = TeamCheckinDeliveryRecord & {
  response: TeamCheckinResponseRecord | null;
  member: { nickname: string; avatarKey: string | null } | null;
  leadMeasure: {
    name: string;
    targetValue: number;
    period: "DAILY" | "WEEKLY" | "MONTHLY";
    trackingMode: "BOOLEAN" | "COUNT";
    dailyTargetCount: number;
  } | null;
  proposal: TeamCheckinAdjustmentProposalRecord | null;
};

export class TeamCheckinStorage {
  constructor(private db: Db) {}

  async findSettings(workspaceId: number): Promise<TeamCheckinSettingsRecord | null> {
    return (
      (await this.db.query.workspaceTeamCheckinSettings.findFirst({
        where: eq(workspaceTeamCheckinSettings.workspaceId, workspaceId),
      })) ?? null
    );
  }

  async upsertSettings(input: {
    workspaceId: number;
    enabled: boolean;
    includeAdminAsMember: boolean;
    triggerNoWeeklyLogEnabled: boolean;
    triggerSlowStartEnabled: boolean;
    sendHour: number;
    dailyMemberLimit: number;
    dailyWorkspaceLimit: number;
  }): Promise<TeamCheckinSettingsRecord> {
    const [record] = await this.db
      .insert(workspaceTeamCheckinSettings)
      .values(input)
      .onConflictDoUpdate({
        target: workspaceTeamCheckinSettings.workspaceId,
        set: {
          enabled: input.enabled,
          includeAdminAsMember: input.includeAdminAsMember,
          triggerNoWeeklyLogEnabled: input.triggerNoWeeklyLogEnabled,
          triggerSlowStartEnabled: input.triggerSlowStartEnabled,
          sendHour: input.sendHour,
          dailyMemberLimit: input.dailyMemberLimit,
          dailyWorkspaceLimit: input.dailyWorkspaceLimit,
          updatedAt: new Date(),
        },
      })
      .returning();

    return record;
  }

  async findEnabledSettingsWithWorkspaces(workspaceId?: number) {
    return await this.db
      .select({
        settings: workspaceTeamCheckinSettings,
        workspace: workspaces,
      })
      .from(workspaceTeamCheckinSettings)
      .innerJoin(workspaces, eq(workspaceTeamCheckinSettings.workspaceId, workspaces.id))
      .innerJoin(
        workspaceBillingState,
        eq(workspaceTeamCheckinSettings.workspaceId, workspaceBillingState.workspaceId),
      )
      .where(
        workspaceId
          ? and(
              eq(workspaceTeamCheckinSettings.enabled, true),
              eq(workspaceTeamCheckinSettings.workspaceId, workspaceId),
              isNull(workspaces.deletedAt),
              inArray(workspaceBillingState.planCode, BASIC_OPERATIONAL_PLAN_CODES),
              inArray(workspaceBillingState.billingStatus, [...BASIC_OPERATIONAL_BILLING_STATUSES]),
            )
          : and(
              eq(workspaceTeamCheckinSettings.enabled, true),
              isNull(workspaces.deletedAt),
              inArray(workspaceBillingState.planCode, BASIC_OPERATIONAL_PLAN_CODES),
              inArray(workspaceBillingState.billingStatus, [...BASIC_OPERATIONAL_BILLING_STATUSES]),
            ),
      );
  }

  async findCandidates(workspaceId: number): Promise<TeamCheckinCandidate[]> {
    const rows = await this.db
      .select({
        workspaceId: workspaces.id,
        workspaceUid: workspaces.uid,
        memberUserId: workspaceMembers.userId,
        memberRole: workspaceMembers.role,
        userLocale: users.locale,
        timezone: userNotificationSettings.timezone,
        scoreboardId: scoreboards.id,
        leadMeasureId: leadMeasures.id,
        leadMeasureName: leadMeasures.name,
        leadMeasureCreatedAt: leadMeasures.createdAt,
        targetValue: leadMeasures.targetValue,
        period: leadMeasures.period,
        trackingMode: leadMeasures.trackingMode,
        dailyTargetCount: leadMeasures.dailyTargetCount,
      })
      .from(workspaceMembers)
      .innerJoin(users, eq(workspaceMembers.userId, users.id))
      .leftJoin(
        userNotificationSettings,
        eq(userNotificationSettings.userId, workspaceMembers.userId),
      )
      .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
      .innerJoin(
        scoreboards,
        and(
          eq(scoreboards.workspaceId, workspaceMembers.workspaceId),
          eq(scoreboards.userId, workspaceMembers.userId),
          eq(scoreboards.status, "ACTIVE"),
        ),
      )
      .innerJoin(
        leadMeasures,
        and(eq(leadMeasures.scoreboardId, scoreboards.id), eq(leadMeasures.status, "ACTIVE")),
      )
      .where(and(eq(workspaceMembers.workspaceId, workspaceId), isNull(workspaces.deletedAt)));

    return rows
      .filter((row) => row.workspaceUid)
      .map((row) => ({
        ...row,
        workspaceUid: row.workspaceUid as string,
      }));
  }

  async findLogsForCandidates(leadMeasureIds: number[], from: string, to: string) {
    if (leadMeasureIds.length === 0) {
      return [];
    }

    return await this.db.query.dailyLogs.findMany({
      where: and(
        inArray(dailyLogs.leadMeasureId, leadMeasureIds),
        gte(dailyLogs.logDate, from),
        lte(dailyLogs.logDate, to),
      ),
    });
  }

  async countDeliveriesForWorkspaceOnDate(
    workspaceId: number,
    dayStart: Date,
    dayEnd: Date,
  ): Promise<number> {
    const [result] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(teamCheckinDeliveries)
      .where(
        and(
          eq(teamCheckinDeliveries.workspaceId, workspaceId),
          gte(teamCheckinDeliveries.createdAt, dayStart),
          lte(teamCheckinDeliveries.createdAt, dayEnd),
        ),
      );

    return Number(result?.count ?? 0);
  }

  async findDeliveriesWithResponsesForWorkspaceOnDate(
    workspaceId: number,
    dayStart: Date,
    dayEnd: Date,
  ) {
    return await this.db
      .select({
        delivery: teamCheckinDeliveries,
        response: teamCheckinResponses,
      })
      .from(teamCheckinDeliveries)
      .leftJoin(teamCheckinResponses, eq(teamCheckinResponses.deliveryId, teamCheckinDeliveries.id))
      .where(
        and(
          eq(teamCheckinDeliveries.workspaceId, workspaceId),
          gte(teamCheckinDeliveries.createdAt, dayStart),
          lte(teamCheckinDeliveries.createdAt, dayEnd),
        ),
      );
  }

  async countDeliveriesForMemberOnDate(
    workspaceId: number,
    memberUserId: number,
    dayStart: Date,
    dayEnd: Date,
  ): Promise<number> {
    const [result] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(teamCheckinDeliveries)
      .where(
        and(
          eq(teamCheckinDeliveries.workspaceId, workspaceId),
          eq(teamCheckinDeliveries.memberUserId, memberUserId),
          gte(teamCheckinDeliveries.createdAt, dayStart),
          lte(teamCheckinDeliveries.createdAt, dayEnd),
        ),
      );

    return Number(result?.count ?? 0);
  }

  async findSameDayResponses(input: {
    workspaceId: number;
    memberUserId: number;
    leadMeasureId: number;
    dayStart: Date;
    dayEnd: Date;
  }): Promise<TeamCheckinResponseRecord[]> {
    return await this.db
      .select({ response: teamCheckinResponses })
      .from(teamCheckinResponses)
      .innerJoin(
        teamCheckinDeliveries,
        eq(teamCheckinResponses.deliveryId, teamCheckinDeliveries.id),
      )
      .where(
        and(
          eq(teamCheckinResponses.workspaceId, input.workspaceId),
          eq(teamCheckinResponses.memberUserId, input.memberUserId),
          eq(teamCheckinDeliveries.leadMeasureId, input.leadMeasureId),
          gte(teamCheckinResponses.createdAt, input.dayStart),
          lte(teamCheckinResponses.createdAt, input.dayEnd),
        ),
      )
      .then((rows) => rows.map((row) => row.response));
  }

  async createDelivery(
    input: typeof teamCheckinDeliveries.$inferInsert,
  ): Promise<TeamCheckinDeliveryRecord | null> {
    try {
      const [record] = await this.db.insert(teamCheckinDeliveries).values(input).returning();
      return record;
    } catch {
      return null;
    }
  }

  async markDeliverySent(id: number, sentAt: Date) {
    await this.db
      .update(teamCheckinDeliveries)
      .set({ sendStatus: "SENT", sentAt, updatedAt: sentAt })
      .where(eq(teamCheckinDeliveries.id, id));
  }

  async markDeliveryFailed(id: number, now: Date) {
    await this.db
      .update(teamCheckinDeliveries)
      .set({ sendStatus: "FAILED", updatedAt: now })
      .where(eq(teamCheckinDeliveries.id, id));
  }

  async markDeliverySkipped(id: number, skipReason: string, now: Date) {
    await this.db
      .update(teamCheckinDeliveries)
      .set({ sendStatus: "SKIPPED", skipReason, updatedAt: now })
      .where(eq(teamCheckinDeliveries.id, id));
  }

  async findActiveDeviceTokens(userId: number) {
    return await this.db.query.devicePushTokens.findMany({
      where: and(
        eq(devicePushTokens.userId, userId),
        eq(devicePushTokens.notificationEnabled, true),
        isNull(devicePushTokens.disabledAt),
      ),
    });
  }

  async disableDevicePushTokens(tokens: string[]) {
    if (tokens.length === 0) return;

    await this.db
      .update(devicePushTokens)
      .set({
        notificationEnabled: false,
        disabledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(inArray(devicePushTokens.token, tokens));
  }

  async findDeliveryByUid(workspaceId: number, uid: string) {
    return (
      (await this.db.query.teamCheckinDeliveries.findFirst({
        where: and(
          eq(teamCheckinDeliveries.workspaceId, workspaceId),
          eq(teamCheckinDeliveries.uid, uid),
        ),
      })) ?? null
    );
  }

  async findResponseByDeliveryId(deliveryId: number) {
    return (
      (await this.db.query.teamCheckinResponses.findFirst({
        where: eq(teamCheckinResponses.deliveryId, deliveryId),
      })) ?? null
    );
  }

  async createResponse(
    input: typeof teamCheckinResponses.$inferInsert,
  ): Promise<TeamCheckinResponseRecord> {
    const [record] = await this.db.insert(teamCheckinResponses).values(input).returning();

    return record;
  }

  async findInboxItems(input: {
    workspaceId: number;
    memberUserId: number;
    limit: number;
    status: "open" | "all" | "resolved";
  }) {
    const deliveries = await this.db
      .select({
        delivery: teamCheckinDeliveries,
        response: teamCheckinResponses,
        leadMeasure: leadMeasures,
      })
      .from(teamCheckinDeliveries)
      .leftJoin(teamCheckinResponses, eq(teamCheckinResponses.deliveryId, teamCheckinDeliveries.id))
      .innerJoin(leadMeasures, eq(teamCheckinDeliveries.leadMeasureId, leadMeasures.id))
      .where(
        and(
          eq(teamCheckinDeliveries.workspaceId, input.workspaceId),
          eq(teamCheckinDeliveries.memberUserId, input.memberUserId),
        ),
      )
      .orderBy(desc(teamCheckinDeliveries.createdAt))
      .limit(input.limit);

    const proposals = await this.db
      .select({
        proposal: teamCheckinAdjustmentProposals,
        leadMeasure: leadMeasures,
        sourceDeliveryUid: teamCheckinDeliveries.uid,
      })
      .from(teamCheckinAdjustmentProposals)
      .innerJoin(leadMeasures, eq(teamCheckinAdjustmentProposals.leadMeasureId, leadMeasures.id))
      .innerJoin(
        teamCheckinDeliveries,
        eq(teamCheckinAdjustmentProposals.sourceDeliveryId, teamCheckinDeliveries.id),
      )
      .where(
        and(
          eq(teamCheckinAdjustmentProposals.workspaceId, input.workspaceId),
          eq(teamCheckinAdjustmentProposals.memberUserId, input.memberUserId),
        ),
      )
      .orderBy(desc(teamCheckinAdjustmentProposals.createdAt))
      .limit(input.limit);

    const deliveryItems = deliveries
      .filter((row) => {
        if (input.status === "open") return row.response === null;
        if (input.status === "resolved") return row.response !== null;
        return true;
      })
      .map((row) => ({ type: "CHECKIN" as const, ...row }));

    const proposalItems = proposals
      .filter((row) => {
        if (input.status === "open") return row.proposal.status === "PROPOSED";
        if (input.status === "resolved") return row.proposal.status !== "PROPOSED";
        return true;
      })
      .map((row) => ({ type: "ADJUSTMENT_PROPOSAL" as const, ...row }));

    return [...deliveryItems, ...proposalItems]
      .sort((a, b) => {
        const aDate = a.type === "CHECKIN" ? a.delivery.createdAt : a.proposal.createdAt;
        const bDate = b.type === "CHECKIN" ? b.delivery.createdAt : b.proposal.createdAt;
        return bDate.getTime() - aDate.getTime();
      })
      .slice(0, input.limit);
  }

  async findReportRows(
    workspaceId: number,
    periodStart: string,
    activeOnly: boolean = false,
  ): Promise<TeamCheckinReportRow[]> {
    let baseQuery = this.db
      .select({
        delivery: teamCheckinDeliveries,
        response: teamCheckinResponses,
        memberNickname: users.nickname,
        memberAvatarKey: users.avatarKey,
        leadMeasureName: leadMeasures.name,
        targetValue: leadMeasures.targetValue,
        period: leadMeasures.period,
        trackingMode: leadMeasures.trackingMode,
        dailyTargetCount: leadMeasures.dailyTargetCount,
        proposal: teamCheckinAdjustmentProposals,
      })
      .from(teamCheckinDeliveries)
      .leftJoin(teamCheckinResponses, eq(teamCheckinResponses.deliveryId, teamCheckinDeliveries.id))
      .innerJoin(users, eq(teamCheckinDeliveries.memberUserId, users.id))
      .innerJoin(leadMeasures, eq(teamCheckinDeliveries.leadMeasureId, leadMeasures.id))
      .leftJoin(
        teamCheckinAdjustmentProposals,
        eq(teamCheckinAdjustmentProposals.sourceResponseId, teamCheckinResponses.id),
      );

    if (activeOnly) {
      baseQuery = baseQuery.innerJoin(
        workspaceMembers,
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.userId, teamCheckinDeliveries.memberUserId),
        ),
      ) as typeof baseQuery;
    }

    const rows = await baseQuery
      .where(
        and(
          eq(teamCheckinDeliveries.workspaceId, workspaceId),
          eq(teamCheckinDeliveries.periodStart, periodStart),
        ),
      )
      .orderBy(desc(teamCheckinDeliveries.createdAt));

    return rows.map((row) => ({
      ...row.delivery,
      response: row.response ?? null,
      member: {
        nickname: row.memberNickname,
        avatarKey: row.memberAvatarKey,
      },
      leadMeasure: {
        name: row.leadMeasureName,
        targetValue: row.targetValue,
        period: row.period,
        trackingMode: row.trackingMode,
        dailyTargetCount: row.dailyTargetCount,
      },
      proposal: row.proposal ?? null,
    }));
  }

  async findLogsByLeadMeasuresAndDateRange(input: {
    leadMeasureIds: number[];
    from: Date;
    to: Date;
  }) {
    if (input.leadMeasureIds.length === 0) return [];

    const fromDate = input.from.toISOString().slice(0, 10);
    const toDate = input.to.toISOString().slice(0, 10);
    return await this.db.query.dailyLogs.findMany({
      where: and(
        inArray(dailyLogs.leadMeasureId, input.leadMeasureIds),
        gte(dailyLogs.logDate, fromDate),
        lte(dailyLogs.logDate, toDate),
      ),
    });
  }

  async findResponseByUid(workspaceId: number, uid: string) {
    const rows = await this.db
      .select({
        response: teamCheckinResponses,
        delivery: teamCheckinDeliveries,
        leadMeasure: leadMeasures,
      })
      .from(teamCheckinResponses)
      .innerJoin(
        teamCheckinDeliveries,
        eq(teamCheckinResponses.deliveryId, teamCheckinDeliveries.id),
      )
      .innerJoin(leadMeasures, eq(teamCheckinDeliveries.leadMeasureId, leadMeasures.id))
      .where(
        and(eq(teamCheckinResponses.workspaceId, workspaceId), eq(teamCheckinResponses.uid, uid)),
      )
      .limit(1);

    return rows[0] ?? null;
  }

  async findOpenProposalForResponse(sourceResponseId: number) {
    return (
      (await this.db.query.teamCheckinAdjustmentProposals.findFirst({
        where: and(
          eq(teamCheckinAdjustmentProposals.sourceResponseId, sourceResponseId),
          eq(teamCheckinAdjustmentProposals.status, "PROPOSED"),
        ),
      })) ?? null
    );
  }

  async findOpenProposalForLeadMeasure(leadMeasureId: number) {
    return (
      (await this.db.query.teamCheckinAdjustmentProposals.findFirst({
        where: and(
          eq(teamCheckinAdjustmentProposals.leadMeasureId, leadMeasureId),
          eq(teamCheckinAdjustmentProposals.status, "PROPOSED"),
        ),
      })) ?? null
    );
  }

  async createProposal(input: typeof teamCheckinAdjustmentProposals.$inferInsert) {
    const [proposal] = await this.db
      .insert(teamCheckinAdjustmentProposals)
      .values(input)
      .returning();

    return proposal;
  }

  async createAudit(input: typeof teamCheckinAdjustmentAuditLogs.$inferInsert) {
    await this.db.insert(teamCheckinAdjustmentAuditLogs).values(input);
  }

  async findProposalByUid(workspaceId: number, uid: string) {
    return (
      (await this.db.query.teamCheckinAdjustmentProposals.findFirst({
        where: and(
          eq(teamCheckinAdjustmentProposals.workspaceId, workspaceId),
          eq(teamCheckinAdjustmentProposals.uid, uid),
        ),
      })) ?? null
    );
  }

  async updateProposal(
    id: number,
    input: Partial<typeof teamCheckinAdjustmentProposals.$inferInsert>,
  ) {
    const [proposal] = await this.db
      .update(teamCheckinAdjustmentProposals)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(teamCheckinAdjustmentProposals.id, id))
      .returning();

    return proposal ?? null;
  }

  async findLeadMeasureForWorkspace(leadMeasureId: number, workspaceId: number) {
    const rows = await this.db
      .select({ leadMeasure: leadMeasures, scoreboard: scoreboards })
      .from(leadMeasures)
      .innerJoin(scoreboards, eq(leadMeasures.scoreboardId, scoreboards.id))
      .where(and(eq(leadMeasures.id, leadMeasureId), eq(scoreboards.workspaceId, workspaceId)))
      .limit(1);

    return rows[0] ?? null;
  }

  async updateLeadMeasureTarget(leadMeasureId: number, targetValue: number) {
    const [record] = await this.db
      .update(leadMeasures)
      .set({ targetValue })
      .where(eq(leadMeasures.id, leadMeasureId))
      .returning();

    return record ?? null;
  }

  async archiveLeadMeasure(leadMeasureId: number) {
    const [record] = await this.db
      .update(leadMeasures)
      .set({ status: "ARCHIVED", archivedAt: new Date() })
      .where(eq(leadMeasures.id, leadMeasureId))
      .returning();

    return record ?? null;
  }

  async createReplacementLeadMeasure(input: {
    scoreboardId: number;
    name: string;
    targetValue: number;
    trackingMode: "BOOLEAN" | "COUNT";
    dailyTargetCount: number;
  }) {
    const [record] = await this.db
      .insert(leadMeasures)
      .values({
        scoreboardId: input.scoreboardId,
        name: input.name,
        targetValue: input.targetValue,
        period: "WEEKLY",
        trackingMode: input.trackingMode,
        dailyTargetCount: input.dailyTargetCount,
      })
      .returning();

    return record;
  }

  async recordUsageEvent(input: typeof basicUsageEvents.$inferInsert) {
    await this.db.insert(basicUsageEvents).values(input);
  }
}
