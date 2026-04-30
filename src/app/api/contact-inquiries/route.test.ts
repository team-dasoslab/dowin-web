import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCloudflareContext = vi.fn();
const mockGetDb = vi.fn();
const mockGetSessionWithRefresh = vi.fn();
const mockGetLocale = vi.fn();
const mockCreateInquiry = vi.fn();
const mockListMyInquiries = vi.fn();

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: mockGetCloudflareContext,
}));

vi.mock("@/db", () => ({
  getDb: mockGetDb,
}));

vi.mock("@/lib/server/auth", () => ({
  getSessionWithRefresh: mockGetSessionWithRefresh,
}));

vi.mock("@/lib/server/locale", () => ({
  getLocale: mockGetLocale,
}));

vi.mock("@/domain/contact/services/contact-inquiry.service", () => ({
  ContactInquiryService: vi.fn(function MockContactInquiryService() {
    return {
      listMyInquiries: mockListMyInquiries,
      createInquiry: mockCreateInquiry,
    };
  }),
}));

vi.mock("@/domain/contact/storage/contact-inquiry.storage", () => ({
  ContactInquiryStorage: vi.fn(),
}));

vi.mock("@/domain/workspace/storage/workspace.storage", () => ({
  WorkspaceStorage: vi.fn(),
}));

vi.mock("@/domain/contact/services/contact-discord-notifier.service", () => ({
  ContactDiscordNotifierService: vi.fn(),
}));

describe("GET/POST /api/contact-inquiries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCloudflareContext.mockReturnValue({
      env: {
        DB: {},
        CONTACT_DISCORD_WEBHOOK_URL: "https://discord.example.com/webhook",
      },
    });
    mockGetDb.mockReturnValue({});
    mockGetLocale.mockResolvedValue("ko");
  });

  it("세션이 없으면 401을 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue(null);

    const { GET } = await import("./route");
    const response = await GET();

    expect(response.status).toBe(401);
  });

  it("GET 요청으로 문의 목록을 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 11 });
    mockListMyInquiries.mockResolvedValue([{ id: 7 }]);

    const { GET } = await import("./route");
    const response = await GET();

    expect(response.status).toBe(200);
    expect(mockListMyInquiries).toHaveBeenCalledWith(11);
  });

  it("POST 요청에서 세션이 없으면 401을 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue(null);

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/contact-inquiries", {
        method: "POST",
        body: JSON.stringify({}),
      }),
    );

    expect(response.status).toBe(401);
  });

  it("유효하지 않은 입력이면 422를 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 11 });

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/contact-inquiries", {
        method: "POST",
        body: JSON.stringify({
          category: "GENERAL",
          replyEmail: "invalid-email",
          subject: "",
          message: "",
          privacyConsent: false,
        }),
      }),
    );

    expect(response.status).toBe(422);
  });

  it("문의 접수를 생성한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 11 });
    mockCreateInquiry.mockResolvedValue({
      id: 7,
      category: "GENERAL",
      status: "RECEIVED",
      replyEmail: "user@example.com",
      subject: "문의",
      source: "CONTACT_PAGE",
      userId: 11,
      workspaceId: 3,
      discordDeliveryStatus: "SENT",
      createdAt: "2026-05-01T11:00:00.000Z",
    });

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/contact-inquiries", {
        method: "POST",
        body: JSON.stringify({
          category: "GENERAL",
          replyEmail: "user@example.com",
          subject: "문의",
          message: "내용",
          privacyConsent: true,
        }),
      }),
    );

    expect(response.status).toBe(201);
    expect(mockCreateInquiry).toHaveBeenCalledWith(
      11,
      {
        category: "GENERAL",
        replyEmail: "user@example.com",
        subject: "문의",
        message: "내용",
        privacyConsent: true,
        locale: "ko",
      },
      {
        webhookUrl: "https://discord.example.com/webhook",
      },
    );
  });
});
