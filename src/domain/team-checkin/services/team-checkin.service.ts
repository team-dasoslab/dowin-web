import { customAlphabet } from "nanoid";
import { serverRuntimeConfig } from "@/config/server-runtime-config";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "@/lib/server/errors";
import {
  TeamCheckinAdjustmentProposalCreateInput,
  TeamCheckinResponseInput,
  TeamCheckinRunInput,
  TeamCheckinSettingsInput,
} from "@/domain/team-checkin/validation";
import {
  TeamCheckinCandidate,
  TeamCheckinReportRow,
  TeamCheckinSettingsRecord,
  TeamCheckinStorage,
} from "@/domain/team-checkin/storage/team-checkin.storage";
import { type WorkspaceAccessContext } from "@/lib/server/workspace-context";

const createUid = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  12,
);

const DEFAULT_SETTINGS = {
  enabled: false,
  includeAdminAsMember: false,
  triggerNoWeeklyLogEnabled: true,
  triggerSlowStartEnabled: true,
  dailyMemberLimit: 2,
  dailyWorkspaceLimit: 30,
};
const MIN_LEAD_MEASURE_AGE_FOR_CHECKIN_MS = 7 * 24 * 60 * 60 * 1000;

type TeamCheckinServiceOptions = {
  leadMeasureAgeGateEnabled?: boolean;
};

type FcmSender = (
  messages: Array<{
    token: string;
    title: string;
    body: string;
    url: string;
    pushType: string;
    campaignId: string;
  }>,
) => Promise<{ success: number; failed: number; disabledTokens: string[] }>;

export class TeamCheckinService {
  private leadMeasureAgeGateEnabled: boolean;

  constructor(
    private storage: TeamCheckinStorage,
    private sendFcmMessages?: FcmSender,
    options: TeamCheckinServiceOptions = {},
  ) {
    this.leadMeasureAgeGateEnabled =
      options.leadMeasureAgeGateEnabled ??
      serverRuntimeConfig.teamCheckinLeadMeasureAgeGateEnabled;
  }

  async getSettings(context: WorkspaceAccessContext) {
    await this.assertBasic(context);
    return this.normalizeSettings(await this.storage.findSettings(context.workspaceId));
  }

  async updateSettings(
    context: WorkspaceAccessContext,
    input: TeamCheckinSettingsInput,
  ) {
    await this.assertAdmin(context);
    await this.assertBasic(context);

    const settings = await this.storage.upsertSettings({
      workspaceId: context.workspaceId,
      ...input,
    });

    if (settings.enabled) {
      await this.storage.recordUsageEvent({
        workspaceId: context.workspaceId,
        actorUserId: context.userId,
        eventType: "TEAM_CHECKIN_ENABLED",
        occurredAt: new Date(),
        metadataJson: "{}",
      });
    }

    return this.normalizeSettings(settings);
  }

  async getInbox(
    context: WorkspaceAccessContext,
    input: { status: "open" | "all" | "resolved"; limit: number },
  ) {
    await this.assertBasic(context);
    const items = await this.storage.findInboxItems({
      workspaceId: context.workspaceId,
      memberUserId: context.userId,
      status: input.status,
      limit: input.limit,
    });

    return {
      items: items.map((item) => {
        if (item.type === "CHECKIN") {
          return {
            type: "CHECKIN" as const,
            id: item.delivery.uid,
            workspaceId: context.workspacePublicId,
            leadMeasureId: item.delivery.leadMeasureId,
            leadMeasureName: item.leadMeasure.name,
            reasonCode: item.delivery.reasonCode,
            periodStart: item.delivery.periodStart,
            periodEnd: item.delivery.periodEnd,
            sentAt: item.delivery.sentAt?.toISOString() ?? item.delivery.createdAt.toISOString(),
            response: item.response
              ? {
                  id: item.response.uid,
                  responseType: item.response.responseType,
                  note: item.response.note,
                  createdAt: item.response.createdAt.toISOString(),
                }
              : null,
          };
        }

        return {
          type: "ADJUSTMENT_PROPOSAL" as const,
          id: item.proposal.uid,
          sourceCheckinId: item.sourceDeliveryUid,
          leadMeasureId: item.proposal.leadMeasureId,
          leadMeasureName: item.leadMeasure.name,
          actionType: item.proposal.actionType,
          payload: JSON.parse(item.proposal.payloadJson) as unknown,
          leaderNote: item.proposal.leaderNote,
          status: item.proposal.status,
          expiresAt: item.proposal.expiresAt.toISOString(),
        };
      }),
      nextCursor: null,
    };
  }

  async respondToCheckin(
    context: WorkspaceAccessContext,
    deliveryUid: string,
    input: TeamCheckinResponseInput,
  ) {
    await this.assertBasic(context);
    const delivery = await this.storage.findDeliveryByUid(
      context.workspaceId,
      deliveryUid,
    );
    if (!delivery || delivery.memberUserId !== context.userId) {
      throw new NotFoundError("TEAM_CHECKIN_NOT_FOUND");
    }

    const existing = await this.storage.findResponseByDeliveryId(delivery.id);
    if (existing) {
      throw new ConflictError("TEAM_CHECKIN_ALREADY_RESPONDED");
    }

    const response = await this.storage.createResponse({
      uid: `res_${createUid()}`,
      deliveryId: delivery.id,
      workspaceId: context.workspaceId,
      memberUserId: context.userId,
      responseType: input.responseType,
      note: input.note?.trim() || null,
    });

    await this.storage.recordUsageEvent({
      workspaceId: context.workspaceId,
      actorUserId: context.userId,
      targetUserId: context.userId,
      leadMeasureId: delivery.leadMeasureId,
      eventType: "TEAM_CHECKIN_RESPONSE_SUBMITTED",
      occurredAt: response.createdAt,
      metadataJson: JSON.stringify({ responseType: response.responseType }),
    });

    return {
      id: response.uid,
      responseType: response.responseType,
      note: response.note,
      createdAt: response.createdAt.toISOString(),
    };
  }

  async getReport(context: WorkspaceAccessContext, weekStart: string) {
    await this.assertAdmin(context);
    await this.assertBasic(context);
    const rows = await this.storage.findReportRows(context.workspaceId, weekStart);
    const rowsWithFollowup = await Promise.all(
      rows.map(async (row) => ({
        row,
        resumedWithin24h: await this.hasResumedWithin24h(row),
      })),
    );
    const sentRows = rows.filter((row) => row.sendStatus === "SENT");
    const respondedRows = rows.filter((row) => row.response);
    const adjustmentRows = rows.filter(
      (row) =>
        row.response?.responseType === "BLOCKED" ||
        row.response?.responseType === "ADJUSTMENT_REQUESTED",
    );
    const proposalRows = rows.filter((row) => row.proposal);
    const acceptedProposalRows = proposalRows.filter(
      (row) => row.proposal?.status === "ACCEPTED",
    );

    await this.storage.recordUsageEvent({
      workspaceId: context.workspaceId,
      actorUserId: context.userId,
      eventType: "TEAM_CHECKIN_REPORT_VIEWED",
      occurredAt: new Date(),
      metadataJson: JSON.stringify({ weekStart }),
    });

    return {
      workspaceId: context.workspacePublicId,
      weekStart,
      weekEnd: addDaysToDateString(weekStart, 6),
      summary: {
        sentCount: sentRows.length,
        recipientCount: new Set(sentRows.map((row) => row.memberUserId)).size,
        respondedCount: respondedRows.length,
        oneTapResponseRate: getRate(respondedRows.length, sentRows.length),
        resumedWithin24hCount: rowsWithFollowup.filter(
          (item) => item.resumedWithin24h,
        ).length,
        resumedWithin24hRate: getRate(
          rowsWithFollowup.filter((item) => item.resumedWithin24h).length,
          respondedRows.length,
        ),
        adjustmentSignalCount: adjustmentRows.length,
        proposalAcceptanceRate: getRate(
          acceptedProposalRows.length,
          proposalRows.length,
        ),
      },
      attentionItems: adjustmentRows
        .filter((row) => !row.proposal || row.proposal.status === "PROPOSED")
        .map((row) => ({
          responseId: row.response?.uid ?? null,
          checkinId: row.uid,
          memberUserId: row.memberUserId,
          memberNickname: row.member?.nickname ?? "이름 없음",
          leadMeasureId: row.leadMeasureId,
          leadMeasureName: row.leadMeasure?.name ?? "",
          signalType: row.response?.responseType ?? null,
          note: row.response?.note ?? null,
          createdAt: row.response?.createdAt.toISOString() ?? row.createdAt.toISOString(),
          openProposalId:
            row.proposal?.status === "PROPOSED" ? row.proposal.uid : null,
        })),
      activity: rows.slice(0, 20).map((row) => ({
        type: row.response ? "CHECKIN_RESPONDED" : "CHECKIN_SENT",
        checkinId: row.uid,
        memberNickname: row.member?.nickname ?? "이름 없음",
        leadMeasureName: row.leadMeasure?.name ?? "",
        createdAt: (row.response?.createdAt ?? row.createdAt).toISOString(),
      })),
    };
  }

  async createAdjustmentProposal(
    context: WorkspaceAccessContext,
    input: TeamCheckinAdjustmentProposalCreateInput,
  ) {
    await this.assertAdmin(context);
    await this.assertBasic(context);
    const source = await this.storage.findResponseByUid(
      context.workspaceId,
      input.sourceResponseId,
    );
    if (!source) {
      throw new NotFoundError("TEAM_CHECKIN_NOT_FOUND");
    }
    if (
      source.response.responseType !== "BLOCKED" &&
      source.response.responseType !== "ADJUSTMENT_REQUESTED"
    ) {
      throw new ConflictError("TEAM_CHECKIN_RESPONSE_NOT_ACTIONABLE");
    }
    if (await this.storage.findOpenProposalForResponse(source.response.id)) {
      throw new ConflictError("TEAM_CHECKIN_PROPOSAL_ALREADY_OPEN");
    }
    if (
      await this.storage.findOpenProposalForLeadMeasure(
        source.delivery.leadMeasureId,
      )
    ) {
      throw new ConflictError("TEAM_CHECKIN_PROPOSAL_ALREADY_OPEN");
    }
    if (source.leadMeasure.period !== "WEEKLY") {
      throw new ConflictError("TEAM_CHECKIN_PROPOSAL_APPLY_FAILED");
    }

    const now = new Date();
    const proposal = await this.storage.createProposal({
      uid: `adj_${createUid()}`,
      workspaceId: context.workspaceId,
      sourceDeliveryId: source.delivery.id,
      sourceResponseId: source.response.id,
      leaderUserId: context.userId,
      memberUserId: source.response.memberUserId,
      leadMeasureId: source.delivery.leadMeasureId,
      actionType: input.actionType,
      payloadJson: JSON.stringify(input.payload),
      leaderNote: input.leaderNote?.trim() || null,
      expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    });

    await this.storage.createAudit({
      proposalId: proposal.id,
      workspaceId: context.workspaceId,
      actorUserId: context.userId,
      eventType: "PROPOSED",
      snapshotJson: JSON.stringify({
        actionType: proposal.actionType,
        payload: input.payload,
      }),
    });
    await this.storage.recordUsageEvent({
      workspaceId: context.workspaceId,
      actorUserId: context.userId,
      targetUserId: proposal.memberUserId,
      leadMeasureId: proposal.leadMeasureId,
      eventType: "TEAM_CHECKIN_ADJUSTMENT_PROPOSED",
      occurredAt: proposal.createdAt,
      metadataJson: JSON.stringify({ actionType: proposal.actionType }),
    });

    return this.serializeProposal(proposal);
  }

  async acceptProposal(context: WorkspaceAccessContext, proposalUid: string) {
    await this.assertBasic(context);
    const proposal = await this.getOpenProposalForMember(context, proposalUid);
    if (proposal.expiresAt < new Date()) {
      await this.storage.updateProposal(proposal.id, {
        status: "EXPIRED",
        respondedAt: new Date(),
      });
      throw new ConflictError("TEAM_CHECKIN_PROPOSAL_EXPIRED");
    }

    const applied = await this.applyProposal(proposal);
    if (!applied.ok) {
      await this.storage.updateProposal(proposal.id, {
        status: "APPLY_FAILED",
        respondedAt: new Date(),
        applyErrorCode: applied.errorCode,
      });
      await this.storage.createAudit({
        proposalId: proposal.id,
        workspaceId: proposal.workspaceId,
        actorUserId: context.userId,
        eventType: "APPLY_FAILED",
        snapshotJson: JSON.stringify({ applyErrorCode: applied.errorCode }),
      });
      throw new ConflictError("TEAM_CHECKIN_PROPOSAL_APPLY_FAILED");
    }

    const now = new Date();
    const updated = await this.storage.updateProposal(proposal.id, {
      status: "ACCEPTED",
      respondedAt: now,
      appliedAt: now,
    });
    await this.storage.createAudit({
      proposalId: proposal.id,
      workspaceId: proposal.workspaceId,
      actorUserId: context.userId,
      eventType: "ACCEPTED",
      snapshotJson: JSON.stringify({
        actionType: proposal.actionType,
        result: applied.result,
      }),
    });
    await this.storage.createAudit({
      proposalId: proposal.id,
      workspaceId: proposal.workspaceId,
      actorUserId: context.userId,
      eventType: "APPLIED",
      snapshotJson: JSON.stringify(applied.result),
    });
    await this.storage.recordUsageEvent({
      workspaceId: proposal.workspaceId,
      actorUserId: context.userId,
      targetUserId: context.userId,
      leadMeasureId: proposal.leadMeasureId,
      eventType: "TEAM_CHECKIN_ADJUSTMENT_ACCEPTED",
      occurredAt: now,
      metadataJson: JSON.stringify({ actionType: proposal.actionType }),
    });
    await this.storage.recordUsageEvent({
      workspaceId: proposal.workspaceId,
      actorUserId: context.userId,
      targetUserId: context.userId,
      leadMeasureId: proposal.leadMeasureId,
      eventType: "TEAM_CHECKIN_ADJUSTMENT_APPLIED",
      occurredAt: now,
      metadataJson: JSON.stringify({ actionType: proposal.actionType }),
    });

    return {
      status: updated?.status ?? "ACCEPTED",
      appliedAt: now.toISOString(),
      result: applied.result,
    };
  }

  async declineProposal(context: WorkspaceAccessContext, proposalUid: string) {
    await this.assertBasic(context);
    const proposal = await this.getOpenProposalForMember(context, proposalUid);
    const now = new Date();
    const updated = await this.storage.updateProposal(proposal.id, {
      status: "DECLINED",
      respondedAt: now,
    });
    await this.storage.createAudit({
      proposalId: proposal.id,
      workspaceId: proposal.workspaceId,
      actorUserId: context.userId,
      eventType: "DECLINED",
      snapshotJson: JSON.stringify({ actionType: proposal.actionType }),
    });

    return { status: updated?.status ?? "DECLINED" };
  }

  async cancelProposal(context: WorkspaceAccessContext, proposalUid: string) {
    await this.assertAdmin(context);
    await this.assertBasic(context);
    const proposal = await this.storage.findProposalByUid(
      context.workspaceId,
      proposalUid,
    );
    if (!proposal) {
      throw new NotFoundError("TEAM_CHECKIN_PROPOSAL_NOT_FOUND");
    }
    if (proposal.status !== "PROPOSED") {
      throw new ConflictError("TEAM_CHECKIN_PROPOSAL_NOT_OPEN");
    }
    const updated = await this.storage.updateProposal(proposal.id, {
      status: "CANCELED",
      respondedAt: new Date(),
    });
    await this.storage.createAudit({
      proposalId: proposal.id,
      workspaceId: proposal.workspaceId,
      actorUserId: context.userId,
      eventType: "CANCELED",
      snapshotJson: JSON.stringify({ actionType: proposal.actionType }),
    });

    return { status: updated?.status ?? "CANCELED" };
  }

  async run(input: TeamCheckinRunInput) {
    const now = input.now ? new Date(input.now) : new Date();
    const settingsRows = await this.storage.findEnabledSettingsWithWorkspaces(
      input.workspaceId ? Number(input.workspaceId) : undefined,
    );
    let candidateCount = 0;
    let createdDeliveryCount = 0;
    let sentCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    for (const { settings, workspace } of settingsRows) {
      const { weekStart, weekEnd } = getKstWeekRange(now);
      const candidates = (await this.storage.findCandidates(workspace.id)).filter(
        (candidate) =>
          settings.includeAdminAsMember || candidate.memberRole !== "ADMIN",
      );
      const weeklyCandidates = candidates.filter((candidate) => {
        if (candidate.period !== "WEEKLY") return false;
        if (!this.leadMeasureAgeGateEnabled) return true;
        return isOldEnoughForCheckin(candidate.leadMeasureCreatedAt, now);
      });
      const logs = await this.storage.findLogsForCandidates(
        weeklyCandidates.map((candidate) => candidate.leadMeasureId),
        weekStart,
        weekEnd,
      );
      const logsByMeasure = groupLogs(logs);
      const dayRange = getKstDayRange(now);
      const existingToday =
        await this.storage.findDeliveriesWithResponsesForWorkspaceOnDate(
          workspace.id,
          dayRange.start,
          dayRange.end,
        );
      let workspaceDeliveryCount = existingToday.length;
      const memberDeliveryCount = new Map<number, number>();
      const suppressedMeasureKeys = new Set<string>();
      for (const row of existingToday) {
        memberDeliveryCount.set(
          row.delivery.memberUserId,
          (memberDeliveryCount.get(row.delivery.memberUserId) ?? 0) + 1,
        );
        if (
          row.response &&
          ["SNOOZE_TODAY", "BLOCKED", "ADJUSTMENT_REQUESTED"].includes(
            row.response.responseType,
          )
        ) {
          suppressedMeasureKeys.add(
            `${row.delivery.memberUserId}:${row.delivery.leadMeasureId}`,
          );
        }
      }

      for (const candidate of weeklyCandidates) {
        const reasonCode = getReasonCode(candidate, logsByMeasure, now, settings);
        if (!reasonCode) continue;
        candidateCount += 1;

        if (workspaceDeliveryCount >= settings.dailyWorkspaceLimit) {
          skippedCount += 1;
          continue;
        }
        const memberCount =
          memberDeliveryCount.get(candidate.memberUserId) ?? 0;
        if (memberCount >= settings.dailyMemberLimit) {
          skippedCount += 1;
          continue;
        }
        if (
          suppressedMeasureKeys.has(
            `${candidate.memberUserId}:${candidate.leadMeasureId}`,
          )
        ) {
          skippedCount += 1;
          continue;
        }

        const title = "Dowin 팀 체크인";
        const body = buildMessageBody(candidate, reasonCode);
        const delivery = await this.storage.createDelivery({
          uid: `chk_${createUid()}`,
          workspaceId: workspace.id,
          memberUserId: candidate.memberUserId,
          leadMeasureId: candidate.leadMeasureId,
          scoreboardId: candidate.scoreboardId,
          reasonCode,
          periodStart: weekStart,
          periodEnd: weekEnd,
          scheduledFor: now,
          sendStatus: "PENDING",
          messageTitle: title,
          messageBody: body,
          deeplinkPath: `/${candidate.userLocale ?? "ko"}/${candidate.workspaceUid}/dashboard/my`,
        });
        if (!delivery) continue;
        workspaceDeliveryCount += 1;
        memberDeliveryCount.set(candidate.memberUserId, memberCount + 1);
        createdDeliveryCount += 1;

        const tokens = await this.storage.findActiveDeviceTokens(
          candidate.memberUserId,
        );
        if (tokens.length === 0) {
          await this.storage.markDeliverySkipped(
            delivery.id,
            "NO_ACTIVE_DEVICE_TOKEN",
            now,
          );
          skippedCount += 1;
          continue;
        }
        if (input.dryRun || !this.sendFcmMessages) {
          await this.storage.markDeliverySkipped(
            delivery.id,
            input.dryRun ? "DRY_RUN" : "FCM_SENDER_NOT_CONFIGURED",
            now,
          );
          skippedCount += 1;
          continue;
        }

        const result = await this.sendFcmMessages(
          tokens.map((token) => ({
            token: token.token,
            title,
            body,
            url: `${delivery.deeplinkPath}?checkinId=${delivery.uid}`,
            pushType: "team_checkin",
            campaignId: `team_checkin:${delivery.uid}`,
          })),
        );
        await this.storage.disableDevicePushTokens(result.disabledTokens);
        if (result.success > 0) {
          await this.storage.markDeliverySent(delivery.id, now);
          sentCount += 1;
          await this.storage.recordUsageEvent({
            workspaceId: workspace.id,
            targetUserId: candidate.memberUserId,
            leadMeasureId: candidate.leadMeasureId,
            eventType: "TEAM_CHECKIN_DELIVERY_SENT",
            occurredAt: now,
            metadataJson: JSON.stringify({ reasonCode }),
          });
        } else {
          await this.storage.markDeliveryFailed(delivery.id, now);
          failedCount += 1;
        }
      }
    }

    return {
      evaluatedWorkspaceCount: settingsRows.length,
      candidateCount,
      createdDeliveryCount,
      sentCount,
      skippedCount,
      failedCount,
    };
  }

  private normalizeSettings(record: TeamCheckinSettingsRecord | null) {
    if (!record) {
      return DEFAULT_SETTINGS;
    }

    return {
      enabled: record.enabled,
      includeAdminAsMember: record.includeAdminAsMember,
      triggerNoWeeklyLogEnabled: record.triggerNoWeeklyLogEnabled,
      triggerSlowStartEnabled: record.triggerSlowStartEnabled,
      dailyMemberLimit: record.dailyMemberLimit,
      dailyWorkspaceLimit: record.dailyWorkspaceLimit,
    };
  }

  private async assertAdmin(context: WorkspaceAccessContext) {
    if (context.role !== "ADMIN") {
      throw new ForbiddenError("FORBIDDEN");
    }
  }

  private async assertBasic(context: WorkspaceAccessContext) {
    if (!context.entitlement.canAccessBasicSubscription) {
      throw new ForbiddenError("BASIC_SUBSCRIPTION_REQUIRED");
    }
  }

  private async getOpenProposalForMember(
    context: WorkspaceAccessContext,
    proposalUid: string,
  ) {
    const proposal = await this.storage.findProposalByUid(
      context.workspaceId,
      proposalUid,
    );
    if (!proposal || proposal.memberUserId !== context.userId) {
      throw new NotFoundError("TEAM_CHECKIN_PROPOSAL_NOT_FOUND");
    }
    if (proposal.status !== "PROPOSED") {
      throw new ConflictError("TEAM_CHECKIN_PROPOSAL_NOT_OPEN");
    }
    return proposal;
  }

  private async applyProposal(
    proposal: Awaited<ReturnType<TeamCheckinStorage["findProposalByUid"]>>,
  ): Promise<
    | { ok: true; result: Record<string, unknown> }
    | { ok: false; errorCode: string }
  > {
    if (!proposal) return { ok: false, errorCode: "PROPOSAL_NOT_FOUND" };
    const target = await this.storage.findLeadMeasureForWorkspace(
      proposal.leadMeasureId,
      proposal.workspaceId,
    );
    if (!target || target.leadMeasure.status !== "ACTIVE") {
      return { ok: false, errorCode: "LEAD_MEASURE_NOT_ACTIVE" };
    }
    if (target.leadMeasure.period !== "WEEKLY") {
      return { ok: false, errorCode: "UNSUPPORTED_PERIOD" };
    }

    const payload = JSON.parse(proposal.payloadJson) as Record<string, unknown>;
    if (proposal.actionType === "CHANGE_TARGET_COUNT") {
      const updated = await this.storage.updateLeadMeasureTarget(
        proposal.leadMeasureId,
        Number(payload.newTargetValue),
      );
      return updated
        ? {
            ok: true,
            result: {
              actionType: proposal.actionType,
              leadMeasureId: updated.id,
              targetValue: updated.targetValue,
            },
          }
        : { ok: false, errorCode: "UPDATE_FAILED" };
    }
    if (proposal.actionType === "ARCHIVE_ACTION_ITEM") {
      const archived = await this.storage.archiveLeadMeasure(
        proposal.leadMeasureId,
      );
      return archived
        ? {
            ok: true,
            result: {
              actionType: proposal.actionType,
              leadMeasureId: archived.id,
              status: archived.status,
            },
          }
        : { ok: false, errorCode: "ARCHIVE_FAILED" };
    }

    await this.storage.archiveLeadMeasure(proposal.leadMeasureId);
    const replacement = await this.storage.createReplacementLeadMeasure({
      scoreboardId: target.scoreboard.id,
      name: String(payload.replacementName),
      targetValue: Number(payload.replacementTargetValue),
      trackingMode: payload.replacementTrackingMode as "BOOLEAN" | "COUNT",
      dailyTargetCount: Number(payload.replacementDailyTargetCount),
    });

    return {
      ok: true,
      result: {
        actionType: proposal.actionType,
        archivedLeadMeasureId: proposal.leadMeasureId,
        replacementLeadMeasureId: replacement.id,
      },
    };
  }

  private serializeProposal(
    proposal: Awaited<ReturnType<TeamCheckinStorage["createProposal"]>>,
  ) {
    return {
      id: proposal.uid,
      actionType: proposal.actionType,
      payload: JSON.parse(proposal.payloadJson) as unknown,
      leaderNote: proposal.leaderNote,
      status: proposal.status,
      expiresAt: proposal.expiresAt.toISOString(),
      createdAt: proposal.createdAt.toISOString(),
    };
  }

  private async hasResumedWithin24h(row: TeamCheckinReportRow) {
    if (!row.response || !row.leadMeasure) return false;
    const logs = await this.storage.findAchievedLogsAfter({
      leadMeasureId: row.leadMeasureId,
      from: row.response.createdAt,
      to: new Date(row.response.createdAt.getTime() + 24 * 60 * 60 * 1000),
      trackingMode: row.leadMeasure.trackingMode,
      dailyTargetCount: row.leadMeasure.dailyTargetCount,
    });
    return logs.length > 0;
  }
}

function getRate(value: number, total: number) {
  if (total === 0) return 0;
  return Math.round((value / total) * 1000) / 10;
}

function groupLogs(
  logs: Array<{
    leadMeasureId: number;
    value: boolean;
    count: number;
  }>,
) {
  const map = new Map<number, typeof logs>();
  for (const log of logs) {
    const current = map.get(log.leadMeasureId) ?? [];
    current.push(log);
    map.set(log.leadMeasureId, current);
  }
  return map;
}

function isOldEnoughForCheckin(createdAt: Date, now: Date) {
  return now.getTime() - createdAt.getTime() >= MIN_LEAD_MEASURE_AGE_FOR_CHECKIN_MS;
}

function getReasonCode(
  candidate: TeamCheckinCandidate,
  logsByMeasure: Map<number, Array<{ value: boolean; count: number }>>,
  now: Date,
  settings: {
    triggerNoWeeklyLogEnabled: boolean;
    triggerSlowStartEnabled: boolean;
  },
) {
  const achievedCount = (logsByMeasure.get(candidate.leadMeasureId) ?? []).filter(
    (log) =>
      candidate.trackingMode === "COUNT"
        ? log.count >= candidate.dailyTargetCount
        : log.value,
  ).length;
  const kstDay = getKstDay(now);
  const kstHour = getKstHour(now);

  if (settings.triggerNoWeeklyLogEnabled && achievedCount === 0) {
    return "NO_WEEKLY_LOG" as const;
  }

  if (settings.triggerSlowStartEnabled) {
    if (candidate.targetValue === 1 && kstDay >= 5 && kstHour >= 10 && achievedCount === 0) {
      return "SLOW_WEEKLY_START" as const;
    }
    if (candidate.targetValue === 2 && kstDay >= 3 && kstHour >= 10 && achievedCount === 0) {
      return "SLOW_WEEKLY_START" as const;
    }
    if (candidate.targetValue >= 3 && kstDay >= 3 && kstHour >= 10 && achievedCount <= 1) {
      return "SLOW_WEEKLY_START" as const;
    }
  }

  return null;
}

function buildMessageBody(
  candidate: TeamCheckinCandidate,
  reasonCode: "NO_WEEKLY_LOG" | "SLOW_WEEKLY_START",
) {
  if (reasonCode === "SLOW_WEEKLY_START") {
    return `${candidate.leadMeasureName} 실행 리듬이 이번 주 목표보다 늦습니다. 가능한 작은 단위로 먼저 재개해 주세요.`;
  }
  return `이번 주 ${candidate.leadMeasureName} 기록이 아직 없어요. 오늘 가능한 가장 작은 실행을 하나만 업데이트해 주세요.`;
}

function getKstWeekRange(now: Date) {
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const day = kst.getUTCDay() === 0 ? 7 : kst.getUTCDay();
  const monday = new Date(kst);
  monday.setUTCDate(kst.getUTCDate() - day + 1);
  const weekStart = formatUtcDate(monday);
  return {
    weekStart,
    weekEnd: addDaysToDateString(weekStart, 6),
  };
}

function getKstDayRange(now: Date) {
  const date = formatUtcDate(new Date(now.getTime() + 9 * 60 * 60 * 1000));
  return {
    start: new Date(`${date}T00:00:00.000+09:00`),
    end: new Date(`${date}T23:59:59.999+09:00`),
  };
}

function getKstDay(now: Date) {
  const day = new Date(now.getTime() + 9 * 60 * 60 * 1000).getUTCDay();
  return day === 0 ? 7 : day;
}

function getKstHour(now: Date) {
  return new Date(now.getTime() + 9 * 60 * 60 * 1000).getUTCHours();
}

function addDaysToDateString(date: string, days: number) {
  const next = new Date(`${date}T00:00:00.000Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return formatUtcDate(next);
}

function formatUtcDate(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}
