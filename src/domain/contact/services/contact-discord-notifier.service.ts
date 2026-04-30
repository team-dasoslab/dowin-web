type DiscordEmbedField = {
  name: string;
  value: string;
  inline?: boolean;
};

export type ContactDiscordNotificationInput = {
  inquiryId: number;
  category: "GENERAL" | "BILLING" | "BUG_OR_ACCOUNT";
  subject: string;
  message: string;
  replyEmail: string;
  locale: "ko" | "en";
  userId: number;
  workspaceId: number | null;
  workspaceName: string | null;
  createdAt: string;
};

export type ContactDiscordWebhookPayload = {
  content: string;
  embeds: Array<{
    title: string;
    description: string;
    color: number;
    fields: DiscordEmbedField[];
  }>;
};

const CONTACT_COLOR = 0x2f95dc;

export class ContactDiscordNotifierService {
  buildPayload(
    input: ContactDiscordNotificationInput,
  ): ContactDiscordWebhookPayload {
    const bodyPreview = truncateForDiscord(input.message, 500);

    return {
      content: `DOWIN 문의 접수 #${input.inquiryId}`,
      embeds: [
        {
          title: `[${input.category}] ${truncateForDiscord(input.subject, 120)}`,
          description: "새 문의가 접수되었습니다.",
          color: CONTACT_COLOR,
          fields: [
            {
              name: "문의 정보",
              value: [
                `문의 ID ${input.inquiryId}`,
                `유형 ${input.category}`,
                `답변 이메일 ${input.replyEmail}`,
                `로케일 ${input.locale}`,
              ].join("\n"),
            },
            {
              name: "사용자 맥락",
              value: [
                `userId ${input.userId}`,
                `workspaceId ${input.workspaceId ?? "없음"}`,
                `workspace ${input.workspaceName ?? "없음"}`,
                `접수 시각 ${input.createdAt}`,
              ].join("\n"),
            },
            {
              name: "문의 내용",
              value: bodyPreview,
            },
          ],
        },
      ],
    };
  }

  async send(params: {
    webhookUrl: string;
    input: ContactDiscordNotificationInput;
    fetchImpl?: typeof fetch;
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

function truncateForDiscord(value: string, limit: number) {
  const normalized = value.trim().replace(/\n{3,}/g, "\n\n");

  if (normalized.length <= limit) {
    return normalized;
  }

  return `${normalized.slice(0, limit - 1)}…`;
}
