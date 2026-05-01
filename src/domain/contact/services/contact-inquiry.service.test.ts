import { ContactInquiryService } from "@/domain/contact/services/contact-inquiry.service";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("ContactInquiryService", () => {
  const findUserWorkspace = vi.fn();
  const create = vi.fn();
  const listByUserId = vi.fn();
  const findByIdAndUserId = vi.fn();
  const listForAdmin = vi.fn();
  const findByIdForAdmin = vi.fn();
  const updateForAdmin = vi.fn();
  const send = vi.fn();

  const service = new ContactInquiryService(
    { findUserWorkspace },
    {
      create,
      listByUserId,
      findByIdAndUserId,
      listForAdmin,
      findByIdForAdmin,
      updateForAdmin,
    },
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
      answerSummary: null,
      answeredAt: null,
      createdAt: new Date("2026-05-01T11:00:00.000Z"),
      updatedAt: new Date("2026-05-01T11:00:00.000Z"),
    });
  });

  it("문의 저장 후 Discord 알림을 best-effort로 보낸다", async () => {
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
    expect(result).toEqual(
      expect.objectContaining({
        id: 7,
        status: "RECEIVED",
      }),
    );
  });

  it("Discord 알림이 실패해도 문의는 생성한다", async () => {
    send.mockRejectedValue(new Error("DISCORD_WEBHOOK_FAILED"));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

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

    expect(consoleError).toHaveBeenCalledWith(
      "[contact-inquiry] discord webhook delivery failed",
      expect.objectContaining({
        inquiryId: 7,
        userId: 11,
        error: "DISCORD_WEBHOOK_FAILED",
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        id: 7,
        status: "RECEIVED",
      }),
    );
    consoleError.mockRestore();
  });

  it("자기 문의 목록을 반환한다", async () => {
    listByUserId.mockResolvedValue([
      {
        id: 7,
        category: "GENERAL",
        status: "IN_PROGRESS",
        subject: "로그인이 안 됩니다",
        message: "세션이 자주 끊깁니다.",
        replyEmail: "user@example.com",
        locale: "ko",
        source: "CONTACT_PAGE",
        userId: 11,
        workspaceId: 3,
        answerSummary: "재현 중입니다.",
        answeredAt: null,
        createdAt: new Date("2026-05-01T11:00:00.000Z"),
        updatedAt: new Date("2026-05-01T11:00:01.000Z"),
      },
    ]);

    const result = await service.listMyInquiries(11);

    expect(result).toEqual([
      expect.objectContaining({
        id: 7,
        status: "IN_PROGRESS",
        answerSummary: "재현 중입니다.",
      }),
    ]);
    expect(result[0]).toHaveProperty("message");
  });

  it("자기 문의 상세를 반환한다", async () => {
    findByIdAndUserId.mockResolvedValue({
      id: 7,
      category: "GENERAL",
      status: "RESOLVED",
      subject: "로그인이 안 됩니다",
      message: "세션이 자주 끊깁니다.",
      replyEmail: "user@example.com",
      locale: "ko",
      source: "CONTACT_PAGE",
      userId: 11,
      workspaceId: 3,
      answerSummary: "세션 재발급 로직을 수정했습니다.",
      answeredAt: new Date("2026-05-01T12:00:00.000Z"),
      createdAt: new Date("2026-05-01T11:00:00.000Z"),
      updatedAt: new Date("2026-05-01T12:00:00.000Z"),
    });

    const result = await service.getMyInquiry(11, 7);

    expect(result).toEqual(
      expect.objectContaining({
        id: 7,
        message: "세션이 자주 끊깁니다.",
        answerSummary: "세션 재발급 로직을 수정했습니다.",
        answeredAt: "2026-05-01T12:00:00.000Z",
      }),
    );
  });

  it("운영자 문의 목록을 반환한다", async () => {
    listForAdmin.mockResolvedValue([
      {
        id: 9,
        category: "BILLING",
        status: "RECEIVED",
        subject: "환불 문의",
        message: "환불 부탁드립니다.",
        replyEmail: "user@example.com",
        locale: "ko",
        source: "CONTACT_PAGE",
        userId: 11,
        workspaceId: 3,
        answerSummary: null,
        answeredAt: null,
        createdAt: new Date("2026-05-01T11:00:00.000Z"),
        updatedAt: new Date("2026-05-01T11:00:00.000Z"),
      },
    ]);

    const result = await service.listAdminInquiries({ status: "RECEIVED" });

    expect(listForAdmin).toHaveBeenCalledWith({ status: "RECEIVED" });
    expect(result[0]).toEqual(
      expect.objectContaining({
        id: 9,
        category: "BILLING",
        status: "RECEIVED",
      }),
    );
    expect(result[0]).toHaveProperty("message");
  });

  it("운영자 문의 상세를 반환한다", async () => {
    findByIdForAdmin.mockResolvedValue({
      id: 10,
      category: "GENERAL",
      status: "IN_PROGRESS",
      subject: "기능 문의",
      message: "어떻게 쓰나요?",
      replyEmail: "user@example.com",
      locale: "ko",
      source: "CONTACT_PAGE",
      userId: 11,
      workspaceId: 3,
      answerSummary: "확인 중입니다.",
      answeredAt: null,
      createdAt: new Date("2026-05-01T11:00:00.000Z"),
      updatedAt: new Date("2026-05-01T11:10:00.000Z"),
    });

    const result = await service.getAdminInquiry(10);

    expect(result).toEqual(
      expect.objectContaining({
        id: 10,
        message: "어떻게 쓰나요?",
        answerSummary: "확인 중입니다.",
      }),
    );
  });

  it("운영자가 문의를 해결 상태로 변경하면 answeredAt과 답변 요약을 저장한다", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-01T12:30:00.000Z"));

    findByIdForAdmin.mockResolvedValue({
      id: 12,
      category: "GENERAL",
      status: "IN_PROGRESS",
      subject: "세션 문의",
      message: "세션이 끊깁니다.",
      replyEmail: "user@example.com",
      locale: "ko",
      source: "CONTACT_PAGE",
      userId: 11,
      workspaceId: 3,
      answerSummary: "확인 중",
      answeredAt: null,
      createdAt: new Date("2026-05-01T11:00:00.000Z"),
      updatedAt: new Date("2026-05-01T11:30:00.000Z"),
    });
    updateForAdmin.mockResolvedValue({
      id: 12,
      category: "GENERAL",
      status: "RESOLVED",
      subject: "세션 문의",
      message: "세션이 끊깁니다.",
      replyEmail: "user@example.com",
      locale: "ko",
      source: "CONTACT_PAGE",
      userId: 11,
      workspaceId: 3,
      answerSummary: "세션 재발급 로직을 수정했습니다.",
      answeredAt: new Date("2026-05-01T12:30:00.000Z"),
      createdAt: new Date("2026-05-01T11:00:00.000Z"),
      updatedAt: new Date("2026-05-01T12:30:00.000Z"),
    });

    const result = await service.updateAdminInquiry(12, {
      status: "RESOLVED",
      answerSummary: "세션 재발급 로직을 수정했습니다.",
    });

    expect(updateForAdmin).toHaveBeenCalledWith(
      12,
      expect.objectContaining({
        status: "RESOLVED",
        answerSummary: "세션 재발급 로직을 수정했습니다.",
        answeredAt: new Date("2026-05-01T12:30:00.000Z"),
      }),
    );
    expect(result.answeredAt).toBe("2026-05-01T12:30:00.000Z");
    vi.useRealTimers();
  });
});
