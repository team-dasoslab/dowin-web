import { getDb } from "@/db";
import { contactInquiries } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";

type Db = ReturnType<typeof getDb>;

export type ContactInquiryRecord = typeof contactInquiries.$inferSelect;

export class ContactInquiryStorage {
  constructor(private db: Db) {}

  async create(input: {
    category: "GENERAL" | "BILLING" | "BUG_OR_ACCOUNT";
    subject: string;
    message: string;
    replyEmail: string;
    consentedAt: Date;
    locale: "ko" | "en";
    source: "CONTACT_PAGE";
    userId: number;
    workspaceId: number | null;
  }): Promise<ContactInquiryRecord> {
    const [created] = await this.db
      .insert(contactInquiries)
      .values(input)
      .returning();

    return created;
  }

  async listByUserId(userId: number): Promise<ContactInquiryRecord[]> {
    return this.db.query.contactInquiries.findMany({
      where: eq(contactInquiries.userId, userId),
      orderBy: [desc(contactInquiries.id)],
    });
  }

  async findByIdAndUserId(
    inquiryId: number,
    userId: number,
  ): Promise<ContactInquiryRecord | null> {
    return (
      (await this.db.query.contactInquiries.findFirst({
        where: and(
          eq(contactInquiries.id, inquiryId),
          eq(contactInquiries.userId, userId),
        ),
      })) ?? null
    );
  }
}
