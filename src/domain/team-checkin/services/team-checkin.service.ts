import { customAlphabet } from "nanoid";
import { serverRuntimeConfig } from "@/config/server-runtime-config";
import {
  DEFAULT_LOCALE,
  isSupportedLocale,
  type Locale,
} from "@/i18n/detect-locale";
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
import en from "@/messages/en.json";
import ko from "@/messages/ko.json";

const messages = { ko, en } as const;

const createUid = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  12,
);

const DEFAULT_SETTINGS = {
  enabled: false,
  includeAdminAsMember: false,
  triggerNoWeeklyLogEnabled: true,
  triggerSlowStartEnabled: false,
  dailyMemberLimit: 2,
  dailyWorkspaceLimit: 30,
};
const MIN_LEAD_MEASURE_AGE_FOR_CHECKIN_MS = 7 * 24 * 60 * 60 * 1000;
const DEFAULT_TIMEZONE = "Asia/Seoul";

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
      triggerSlowStartEnabled: false,
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

  async getReport(context: WorkspaceAccessContext, weekStart: string, activeOnly: boolean = false) {
    await this.assertAdmin(context);
    await this.assertBasic(context);
    const rows = await this.storage.findReportRows(context.workspaceId, weekStart, activeOnly);
    const rowsWithFollowup = await Promise.all(
      rows.map(async (row) => ({
        row,
        resumedWithin24h: await this.hasResumedWithin24h(row),
      })),
    );
    const sentRows = rows;
    const respondedRows = rows.filter((row) => row.response);
    const adjustmentRows = rows.filter(
      (row) =>
        row.response?.responseType === "BLOCKED" ||
        row.response?.responseType === "ADJUSTMENT_REQUESTED",
    );
    const attentionRows = adjustmentRows.filter((row) => !row.proposal);
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
        adjustmentSignalCount: attentionRows.length,
        proposalAcceptanceRate: getRate(
          acceptedProposalRows.length,
          proposalRows.length,
        ),
      },
      attentionItems: adjustmentRows
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
          isResolved: !!row.proposal,
          resolvedAt: row.proposal?.createdAt.toISOString() ?? null,
          resolvedProposal: row.proposal
            ? {
                actionType: row.proposal.actionType,
                leaderNote: row.proposal.leaderNote,
                payloadJson: row.proposal.payloadJson,
                status: row.proposal.status,
                createdAt: row.proposal.createdAt.toISOString(),
              }
            : null,
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
      const candidates = (await this.storage.findCandidates(workspace.id)).filter(
        (candidate) =>
          settings.includeAdminAsMember || candidate.memberRole !== "ADMIN",
      );
      const weeklyCandidates = candidates.filter((candidate) => {
        if (candidate.period !== "WEEKLY") return false;
        if (!this.leadMeasureAgeGateEnabled) return true;
        return isOldEnoughForCheckin(candidate.leadMeasureCreatedAt, now);
      });
      const candidateContexts = weeklyCandidates.map((candidate) => {
        const timezone = resolveTimezone(candidate.timezone);

        return {
          candidate,
          weekRange: getLocalWeekRange(now, timezone),
          dayRange: getLocalDayRange(now, timezone),
        };
      });
      const logRange = getCombinedLogRange(
        candidateContexts.map((context) => context.weekRange),
      );
      const logs = await this.storage.findLogsForCandidates(
        weeklyCandidates.map((candidate) => candidate.leadMeasureId),
        logRange.from,
        logRange.to,
      );
      const logsByMeasure = groupLogs(logs);
      const deliveryRange = getCombinedDeliveryRange(
        candidateContexts.map((context) => context.dayRange),
      );
      const existingToday =
        await this.storage.findDeliveriesWithResponsesForWorkspaceOnDate(
          workspace.id,
          deliveryRange.start,
          deliveryRange.end,
        );
      const createdDuringRun: Array<{
        memberUserId: number;
        leadMeasureId: number;
        createdAt: Date;
      }> = [];

      for (const {
        candidate,
        weekRange,
        dayRange,
      } of candidateContexts) {
        const reasonCode = getReasonCode(
          candidate,
          logsByMeasure.get(candidate.leadMeasureId) ?? [],
          weekRange,
          settings,
        );
        if (!reasonCode) continue;
        candidateCount += 1;

        const workspaceDeliveryCount =
          existingToday.filter((row) =>
            isWithinRange(row.delivery.createdAt, dayRange),
          ).length +
          createdDuringRun.filter((row) => isWithinRange(row.createdAt, dayRange))
            .length;
        if (workspaceDeliveryCount >= settings.dailyWorkspaceLimit) {
          skippedCount += 1;
          continue;
        }
        const memberCount =
          existingToday.filter(
            (row) =>
              row.delivery.memberUserId === candidate.memberUserId &&
              isWithinRange(row.delivery.createdAt, dayRange),
          ).length +
          createdDuringRun.filter(
            (row) =>
              row.memberUserId === candidate.memberUserId &&
              isWithinRange(row.createdAt, dayRange),
          ).length;
        if (memberCount >= settings.dailyMemberLimit) {
          skippedCount += 1;
          continue;
        }
        const isSuppressedToday = existingToday.some(
          (row) =>
            row.delivery.memberUserId === candidate.memberUserId &&
            row.delivery.leadMeasureId === candidate.leadMeasureId &&
            isWithinRange(row.delivery.createdAt, dayRange) &&
            row.response &&
            ["SNOOZE_TODAY", "BLOCKED", "ADJUSTMENT_REQUESTED"].includes(
              row.response.responseType,
            ),
        );
        if (isSuppressedToday) {
          skippedCount += 1;
          continue;
        }

        const { title, body } = buildPushMessage(candidate);
        const delivery = await this.storage.createDelivery({
          uid: `chk_${createUid()}`,
          workspaceId: workspace.id,
          memberUserId: candidate.memberUserId,
          leadMeasureId: candidate.leadMeasureId,
          scoreboardId: candidate.scoreboardId,
          reasonCode,
          periodStart: weekRange.weekStart,
          periodEnd: weekRange.weekEnd,
          scheduledFor: now,
          sendStatus: "PENDING",
          messageTitle: title,
          messageBody: body,
          deeplinkPath: `/${candidate.userLocale ?? "ko"}/${candidate.workspaceUid}/dashboard/my`,
        });
        if (!delivery) continue;
        createdDuringRun.push({
          memberUserId: candidate.memberUserId,
          leadMeasureId: candidate.leadMeasureId,
          createdAt: now,
        });
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
      triggerSlowStartEnabled: false,
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
    logDate: string;
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
  logsForMeasure: Array<{ logDate: string; value: boolean; count: number }>,
  weekRange: { weekStart: string; weekEnd: string },
  settings: {
    triggerNoWeeklyLogEnabled: boolean;
  },
) {
  const achievedCount = logsForMeasure.filter(
    (log) => {
      if (log.logDate < weekRange.weekStart || log.logDate > weekRange.weekEnd) {
        return false;
      }

      return candidate.trackingMode === "COUNT"
        ? log.count >= candidate.dailyTargetCount
        : log.value;
    },
  ).length;

  if (settings.triggerNoWeeklyLogEnabled && achievedCount === 0) {
    return "NO_WEEKLY_LOG" as const;
  }

  return null;
}

function buildPushMessage(candidate: TeamCheckinCandidate) {
  const locale = resolvePushLocale(candidate.userLocale);
  const t = messages[locale].Notification;

  return {
    title: t.teamCheckinTitle,
    body: t.teamCheckinBody.replace(
      "{actionItemName}",
      candidate.leadMeasureName,
    ),
  };
}

function resolvePushLocale(locale?: string | null): Locale {
  return isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;
}

function addDaysToDateString(date: string, days: number) {
  const next = new Date(`${date}T00:00:00.000Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return formatUtcDate(next);
}

function formatUtcDate(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function resolveTimezone(timezone?: string | null) {
  const value = timezone || DEFAULT_TIMEZONE;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format(new Date(0));
    return value;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

function getLocalWeekRange(now: Date, timezone: string) {
  const parts = getLocalDateTimeParts(now, timezone);
  const weekStart = addDaysToDateString(parts.date, -parts.day + 1);
  return {
    weekStart,
    weekEnd: addDaysToDateString(weekStart, 6),
  };
}

function getLocalDayRange(now: Date, timezone: string) {
  const { date } = getLocalDateTimeParts(now, timezone);
  const nextDate = addDaysToDateString(date, 1);
  return {
    start: zonedDateTimeToUtc(date, timezone),
    end: new Date(zonedDateTimeToUtc(nextDate, timezone).getTime() - 1),
  };
}

function getCombinedLogRange(
  ranges: Array<{ weekStart: string; weekEnd: string }>,
) {
  if (ranges.length === 0) {
    return { from: "9999-12-31", to: "0000-01-01" };
  }

  return {
    from: ranges.reduce(
      (min, range) => (range.weekStart < min ? range.weekStart : min),
      ranges[0].weekStart,
    ),
    to: ranges.reduce(
      (max, range) => (range.weekEnd > max ? range.weekEnd : max),
      ranges[0].weekEnd,
    ),
  };
}

function getCombinedDeliveryRange(ranges: Array<{ start: Date; end: Date }>) {
  if (ranges.length === 0) {
    const now = new Date();
    return { start: now, end: now };
  }

  return {
    start: ranges.reduce(
      (min, range) => (range.start < min ? range.start : min),
      ranges[0].start,
    ),
    end: ranges.reduce(
      (max, range) => (range.end > max ? range.end : max),
      ranges[0].end,
    ),
  };
}

function isWithinRange(value: Date, range: { start: Date; end: Date }) {
  return value >= range.start && value <= range.end;
}

function getLocalDateTimeParts(now: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  const weekday = get("weekday");
  const day = weekdayToIsoDay(weekday);
  const year = get("year");
  const month = get("month");
  const dateDay = get("day");

  return {
    date: `${year}-${month}-${dateDay}`,
    day,
    hour: Number(get("hour")),
    minute: Number(get("minute")),
  };
}

function weekdayToIsoDay(value: string) {
  const days: Record<string, number> = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
    Sun: 7,
  };
  return days[value] ?? 1;
}

function zonedDateTimeToUtc(date: string, timezone: string) {
  const [year, month, day] = date.split("-").map(Number);
  const utcGuess = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  const localParts = getLocalDateTimeParts(utcGuess, timezone);
  const localAsUtc = new Date(
    `${localParts.date}T${String(localParts.hour).padStart(2, "0")}:${String(
      localParts.minute,
    ).padStart(2, "0")}:00.000Z`,
  );
  const offsetMs = localAsUtc.getTime() - utcGuess.getTime();
  return new Date(utcGuess.getTime() - offsetMs);
}
