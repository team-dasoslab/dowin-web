import { ContactInquiryService } from "@/domain/contact/services/contact-inquiry.service";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("ContactInquiryService", () => {
  const findUserWorkspace = vi.fn();
  const create = vi.fn();
  const updateDiscordDelivery = vi.fn();
  const send = vi.fn();

  const service = new ContactInquiryService(
    { findUserWorkspace },
    { create, updateDiscordDelivery },
    { send },
  );

  beforeEach(() => {
    vi.clearAllMocks();
    findUserWorkspace.mockResolvedValue({ id: 3, name: "러닝 크루" });
    create.mockResolvedValue({
      id: 7,
      category: "GENERAL",
      status: "RECEIVED",
      subject: "로그인이 안 됩니다",
      message: "세션이 자주 끊깁니다.",
      replyEmail: "user@example.com",
      locale: "ko",
      source: "CONTACT_PAGE",
      userId: 11,
      workspaceId: 3,
      discordDeliveryStatus: "PENDING",
      createdAt: new Date("2026-05-01T11:00:00.000Z"),
      updatedAt: new Date("2026-05-01T11:00:00.000Z"),
    });
  });

  it("문의 저장 후 Discord 알림을 보내고 SENT 상태를 반환한다", async () => {
    updateDiscordDelivery.mockResolvedValue({
      id: 7,
      category: "GENERAL",
      status: "RECEIVED",
      subject: "로그인이 안 됩니다",
      message: "세션이 자주 끊깁니다.",
      replyEmail: "user@example.com",
      locale: "ko",
      source: "CONTACT_PAGE",
      userId: 11,
      workspaceId: 3,
      discordDeliveryStatus: "SENT",
      createdAt: new Date("2026-05-01T11:00:00.000Z"),
      updatedAt: new Date("2026-05-01T11:00:01.000Z"),
    });

    const result = await service.createInquiry(
      11,
      {
        category: "GENERAL",
        replyEmail: "user@example.com",
        subject: "로그인이 안 됩니다",
        message: "세션이 자주 끊깁니다.",
        locale: "ko",
      },
      {
        webhookUrl: "https://discord.example.com/webhook",
      },
    );

    expect(send).toHaveBeenCalled();
    expect(updateDiscordDelivery).toHaveBeenCalledWith({
      inquiryId: 7,
      status: "SENT",
    });
    expect(result.discordDeliveryStatus).toBe("SENT");
  });

  it("Discord 알림이 실패해도 문의는 생성하고 FAILED 상태를 반환한다", async () => {
    send.mockRejectedValue(new Error("DISCORD_WEBHOOK_FAILED"));
    updateDiscordDelivery.mockResolvedValue({
      id: 7,
      category: "GENERAL",
      status: "RECEIVED",
      subject: "로그인이 안 됩니다",
      message: "세션이 자주 끊깁니다.",
      replyEmail: "user@example.com",
      locale: "ko",
      source: "CONTACT_PAGE",
      userId: 11,
      workspaceId: 3,
      discordDeliveryStatus: "FAILED",
      createdAt: new Date("2026-05-01T11:00:00.000Z"),
      updatedAt: new Date("2026-05-01T11:00:01.000Z"),
    });

    const result = await service.createInquiry(
      11,
      {
        category: "GENERAL",
        replyEmail: "user@example.com",
        subject: "로그인이 안 됩니다",
        message: "세션이 자주 끊깁니다.",
        locale: "ko",
      },
      {
        webhookUrl: "https://discord.example.com/webhook",
      },
    );

    expect(updateDiscordDelivery).toHaveBeenCalledWith({
      inquiryId: 7,
      status: "FAILED",
      failureReason: "DISCORD_WEBHOOK_FAILED",
    });
    expect(result.discordDeliveryStatus).toBe("FAILED");
  });
});
