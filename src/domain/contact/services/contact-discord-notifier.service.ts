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
    const bodyPreview = truncateForDiscord(input.message, 1000);
    const categoryLabel = getFriendlyCategory(input.category);
    const localeLabel = input.locale === "ko" ? "🇰🇷 한국어" : "🇺🇸 English";

    return {
      content: "", // Redundant summary removed
      embeds: [
        {
          title: `[${categoryLabel}] ${truncateForDiscord(input.subject, 100)}`,
          description: "새로운 고객 문의가 접수되었습니다.",
          color: CONTACT_COLOR,
          fields: [
            {
              name: "문의 정보",
              value: [
                `**ID:** \`#${input.inquiryId}\``,
                `**유형:** ${categoryLabel}`,
                `**언어:** ${localeLabel}`,
              ].join("\n"),
              inline: true,
            },
            {
              name: "연락처",
              value: `**이메일:** [${input.replyEmail}](mailto:${input.replyEmail})`,
              inline: true,
            },
            {
              name: "사용자 정보",
              value: [
                `**User ID:** \`${input.userId}\``,
                `**Workspace:** ${input.workspaceName ?? "없음"} (\`${input.workspaceId ?? "none"}\`)`,
              ].join("\n"),
            },
            {
              name: "문의 내용",
              value: bodyPreview || "_내용 없음_",
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

function getFriendlyCategory(category: string) {
  switch (category) {
    case "BILLING":
      return "💳 결제/환불";
    case "BUG_OR_ACCOUNT":
      return "🐛 버그/계정";
    case "GENERAL":
      return "💬 일반 문의";
    default:
      return category;
  }
}

function truncateForDiscord(value: string, limit: number) {
  const normalized = value.trim().replace(/\n{3,}/g, "\n\n");

  if (normalized.length <= limit) {
    return normalized;
  }

  return `${normalized.slice(0, limit - 1)}…`;
}
