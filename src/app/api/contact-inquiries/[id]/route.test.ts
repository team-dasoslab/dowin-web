import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mockGetCloudflareContext = vi.fn();
const mockGetDb = vi.fn();
const mockGetSessionWithRefresh = vi.fn();
const mockGetMyInquiry = vi.fn();

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: mockGetCloudflareContext,
}));

vi.mock("@/db", () => ({
  getDb: mockGetDb,
}));

vi.mock("@/lib/server/auth", () => ({
  getSessionWithRefresh: mockGetSessionWithRefresh,
}));

vi.mock("@/domain/contact/services/contact-inquiry.service", () => ({
  ContactInquiryService: vi.fn(function MockContactInquiryService() {
    return {
      getMyInquiry: mockGetMyInquiry,
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

describe("GET /api/contact-inquiries/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCloudflareContext.mockReturnValue({ env: { DB: {} } });
    mockGetDb.mockReturnValue({});
  });

  it("세션이 없으면 401을 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue(null);

    const { GET } = await import("./route");
    const response = await GET(new NextRequest("http://localhost/api/contact-inquiries/7"), {
      params: Promise.resolve({ id: "7" }),
    });

    expect(response.status).toBe(401);
  });

  it("유효하지 않은 id면 422를 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 11 });

    const { GET } = await import("./route");
    const response = await GET(new NextRequest("http://localhost/api/contact-inquiries/not-number"), {
      params: Promise.resolve({ id: "abc" }),
    });

    expect(response.status).toBe(422);
  });

  it("문의 상세를 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 11 });
    mockGetMyInquiry.mockResolvedValue({ id: 7 });

    const { GET } = await import("./route");
    const response = await GET(new NextRequest("http://localhost/api/contact-inquiries/7"), {
      params: Promise.resolve({ id: "7" }),
    });

    expect(response.status).toBe(200);
    expect(mockGetMyInquiry).toHaveBeenCalledWith(11, 7);
  });
});
