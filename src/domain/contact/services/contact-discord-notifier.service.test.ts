import {
  ContactDiscordNotifierService,
  type ContactDiscordNotificationInput,
} from "@/domain/contact/services/contact-discord-notifier.service";
import { describe, expect, it, vi } from "vitest";

describe("ContactDiscordNotifierService", () => {
  const service = new ContactDiscordNotifierService();

  const input: ContactDiscordNotificationInput = {
    inquiryId: 7,
    category: "BILLING",
    subject: "결제했는데 플랜이 안 바뀝니다",
    message: "결제 직후 billing 화면이 그대로 FREE로 보입니다.",
    replyEmail: "user@example.com",
    locale: "ko",
    userId: 11,
    workspaceId: 3,
    workspaceName: "러닝 크루",
    createdAt: "2026-05-01T11:00:00.000Z",
  };

  it("Discord 전송용 문의 payload를 만든다", () => {
    const payload = service.buildPayload(input);

    expect(payload.content).toBe("DOWIN 문의 접수 #7");
    expect(payload.embeds[0].fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "문의 정보",
          value: expect.stringContaining("#7"),
        }),
        expect.objectContaining({
          name: "연락처",
          value: expect.stringContaining("user@example.com"),
        }),
        expect.objectContaining({
          name: "사용자 정보",
          value: expect.stringContaining("러닝 크루"),
        }),
      ]),
    );
  });

  it("Discord 웹훅으로 문의 payload를 전송한다", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true });

    await service.send({
      webhookUrl: "https://discord.example.com/webhook",
      input,
      fetchImpl: fetchImpl as never,
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://discord.example.com/webhook",
      expect.objectContaining({
        method: "POST",
      }),
    );
  });
});
