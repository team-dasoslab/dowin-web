import { contactInquiries } from "@/db/schema";
import { ContactInquiryStorage } from "@/domain/contact/storage/contact-inquiry.storage";
import { beforeEach, describe, expect, it, vi } from "vitest";

type MockDb = {
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  values: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
  where: ReturnType<typeof vi.fn>;
  returning: ReturnType<typeof vi.fn>;
};

describe("ContactInquiryStorage", () => {
  const mockDb = {
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    returning: vi.fn(),
  } satisfies MockDb;

  const storage = new ContactInquiryStorage(
    mockDb as unknown as ConstructorParameters<typeof ContactInquiryStorage>[0],
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("문의 레코드를 생성한다", async () => {
    mockDb.returning.mockResolvedValueOnce([
      {
        id: 1,
        category: "GENERAL",
        status: "RECEIVED",
        subject: "문의",
      },
    ]);

    const result = await storage.create({
      category: "GENERAL",
      subject: "문의",
      message: "내용",
      replyEmail: "user@example.com",
      consentedAt: new Date("2026-05-01T00:00:00.000Z"),
      locale: "ko",
      source: "CONTACT_PAGE",
      userId: 3,
      workspaceId: 5,
    });

    expect(mockDb.insert).toHaveBeenCalledWith(contactInquiries);
    expect(result.id).toBe(1);
  });

  it("Discord 전송 상태를 갱신한다", async () => {
    mockDb.returning.mockResolvedValueOnce([
      {
        id: 1,
        discordDeliveryStatus: "SENT",
      },
    ]);

    const result = await storage.updateDiscordDelivery({
      inquiryId: 1,
      status: "SENT",
    });

    expect(mockDb.update).toHaveBeenCalledWith(contactInquiries);
    expect(result?.discordDeliveryStatus).toBe("SENT");
  });
});
