import { contactInquiries } from "@/db/schema";
import { ContactInquiryStorage } from "@/domain/contact/storage/contact-inquiry.storage";
import { beforeEach, describe, expect, it, vi } from "vitest";

type MockDb = {
  query: {
    contactInquiries: {
      findMany: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
    };
  };
  insert: ReturnType<typeof vi.fn>;
  values: ReturnType<typeof vi.fn>;
  returning: ReturnType<typeof vi.fn>;
};

describe("ContactInquiryStorage", () => {
  const mockDb = {
    query: {
      contactInquiries: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
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

  it("사용자 기준 문의 목록을 조회한다", async () => {
    mockDb.query.contactInquiries.findMany.mockResolvedValue([{ id: 3 }]);

    const result = await storage.listByUserId(11);

    expect(mockDb.query.contactInquiries.findMany).toHaveBeenCalled();
    expect(result).toHaveLength(1);
  });

  it("사용자 기준 문의 상세를 조회한다", async () => {
    mockDb.query.contactInquiries.findFirst.mockResolvedValue({ id: 5 });

    const result = await storage.findByIdAndUserId(5, 11);

    expect(mockDb.query.contactInquiries.findFirst).toHaveBeenCalled();
    expect(result?.id).toBe(5);
  });
});
