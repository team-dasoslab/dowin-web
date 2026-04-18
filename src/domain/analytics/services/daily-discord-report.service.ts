export type DailyDiscordReportInput = {
  reportDate: string;
  timezone: string;
  acquisition: {
    signUps: number;
    workspaceActivatedUsers: number;
    scoreboardCreatedUsers: number;
    firstLogUsers: number;
    activationRateFromSignup?: number | null;
    firstLogRateFromScoreboard?: number | null;
  };
  engagement: {
    activeUsers: number;
    loggingUsers: number;
    streakCandidateUsers: number;
  };
  retention: {
    returningUsers7d: number;
    retainedUsers14d: number;
  };
  intervention: {
    pushClicks: number;
    pushFollowupConversions24h: number;
    leaderReportClicks?: number | null;
    leaderReminderConversions24h?: number | null;
  };
  alerts?: string[];
  notes?: string[];
};

type DiscordEmbedField = {
  name: string;
  value: string;
  inline?: boolean;
};

export type DiscordWebhookPayload = {
  content: string;
  embeds: Array<{
    title: string;
    description: string;
    color: number;
    fields: DiscordEmbedField[];
  }>;
};

type FetchLike = typeof fetch;

const REPORT_COLOR = 0x3366ff;

export class DailyDiscordReportService {
  buildPayload(input: DailyDiscordReportInput): DiscordWebhookPayload {
    const alerts = input.alerts ?? [];
    const notes = input.notes ?? [];

    const fields: DiscordEmbedField[] = [
      {
        name: "Activation",
        value: [
          `가입 ${input.acquisition.signUps}`,
          `워크스페이스 진입 ${input.acquisition.workspaceActivatedUsers}`,
          `점수판 생성 ${input.acquisition.scoreboardCreatedUsers}`,
          `첫 기록 ${input.acquisition.firstLogUsers}`,
          formatRateLine(
            "가입→워크스페이스",
            input.acquisition.activationRateFromSignup,
          ),
          formatRateLine(
            "점수판→첫 기록",
            input.acquisition.firstLogRateFromScoreboard,
          ),
        ].join("\n"),
      },
      {
        name: "Engagement",
        value: [
          `활성 사용자 ${input.engagement.activeUsers}`,
          `기록 사용자 ${input.engagement.loggingUsers}`,
          `연속 사용 후보 ${input.engagement.streakCandidateUsers}`,
        ].join("\n"),
        inline: true,
      },
      {
        name: "Retention",
        value: [
          `7일 재방문 ${input.retention.returningUsers7d}`,
          `14일 재기록 ${input.retention.retainedUsers14d}`,
        ].join("\n"),
        inline: true,
      },
      {
        name: "Intervention",
        value: [
          `푸시 클릭 ${input.intervention.pushClicks}`,
          `24h 후속 기록 ${input.intervention.pushFollowupConversions24h}`,
          formatCountLine(
            "리더 리포트 클릭",
            input.intervention.leaderReportClicks,
          ),
          formatCountLine(
            "리더 개입 후 24h 기록",
            input.intervention.leaderReminderConversions24h,
          ),
        ].join("\n"),
      },
      {
        name: "Alerts",
        value:
          alerts.length > 0
            ? alerts.map((alert) => `- ${alert}`).join("\n")
            : "- 이상 징후 없음",
      },
    ];

    if (notes.length > 0) {
      fields.push({
        name: "Next Check",
        value: notes.map((note) => `- ${note}`).join("\n"),
      });
    }

    return {
      content: `WIG Daily Report · ${input.reportDate} (${input.timezone})`,
      embeds: [
        {
          title: "무료 가치 / 리텐션 일일 리포트",
          description:
            "핵심 퍼널, 반복 사용 신호, 개입 후 행동을 한 번에 확인하는 운영 요약입니다.",
          color: REPORT_COLOR,
          fields,
        },
      ],
    };
  }

  async send(params: {
    webhookUrl: string;
    input: DailyDiscordReportInput;
    fetchImpl?: FetchLike;
  }) {
    const payload = this.buildPayload(params.input);
    const fetchImpl = params.fetchImpl ?? fetch;

    const response = await fetchImpl(params.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const responseText = await response.text();
      throw new Error(
        `DISCORD_WEBHOOK_FAILED: ${response.status} ${responseText}`,
      );
    }

    return payload;
  }
}

function formatRateLine(label: string, value?: number | null) {
  if (typeof value !== "number") {
    return `${label} n/a`;
  }

  return `${label} ${value.toFixed(1)}%`;
}

function formatCountLine(label: string, value?: number | null) {
  if (typeof value !== "number") {
    return `${label} n/a`;
  }

  return `${label} ${value}`;
}
