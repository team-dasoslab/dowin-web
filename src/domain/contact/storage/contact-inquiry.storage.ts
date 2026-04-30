import { getDb } from "@/db";
import { contactInquiries } from "@/db/schema";
import { eq } from "drizzle-orm";

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

  async updateDiscordDelivery(input: {
    inquiryId: number;
    status: "SENT" | "FAILED";
    failureReason?: string | null;
  }): Promise<ContactInquiryRecord | null> {
    const [updated] = await this.db
      .update(contactInquiries)
      .set({
        discordDeliveryStatus: input.status,
        discordFailureReason:
          input.status === "FAILED" ? (input.failureReason ?? null) : null,
        discordDeliveredAt: input.status === "SENT" ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(contactInquiries.id, input.inquiryId))
      .returning();

    return updated ?? null;
  }
}
