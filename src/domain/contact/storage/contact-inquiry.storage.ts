import { getDb } from "@/db";
import { contactInquiries } from "@/db/schema";
import { and, desc, eq, type SQL } from "drizzle-orm";

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

  async listForAdmin(filters?: {
    status?: "RECEIVED" | "IN_PROGRESS" | "RESOLVED";
    category?: "GENERAL" | "BILLING" | "BUG_OR_ACCOUNT";
    userId?: number;
    workspaceId?: number;
  }): Promise<ContactInquiryRecord[]> {
    const conditions: SQL[] = [];

    if (filters?.status) {
      conditions.push(eq(contactInquiries.status, filters.status));
    }
    if (filters?.category) {
      conditions.push(eq(contactInquiries.category, filters.category));
    }
    if (filters?.userId) {
      conditions.push(eq(contactInquiries.userId, filters.userId));
    }
    if (filters?.workspaceId) {
      conditions.push(eq(contactInquiries.workspaceId, filters.workspaceId));
    }

    return this.db.query.contactInquiries.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(contactInquiries.id)],
    });
  }

  async findByIdForAdmin(inquiryId: number): Promise<ContactInquiryRecord | null> {
    return (
      (await this.db.query.contactInquiries.findFirst({
        where: eq(contactInquiries.id, inquiryId),
      })) ?? null
    );
  }

  async updateForAdmin(
    inquiryId: number,
    input: {
      status?: "RECEIVED" | "IN_PROGRESS" | "RESOLVED";
      answerSummary?: string | null;
      answeredAt?: Date | null;
    },
  ): Promise<ContactInquiryRecord | null> {
    const [updated] = await this.db
      .update(contactInquiries)
      .set({
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.answerSummary !== undefined
          ? { answerSummary: input.answerSummary }
          : {}),
        ...(input.answeredAt !== undefined ? { answeredAt: input.answeredAt } : {}),
        updatedAt: new Date(),
      })
      .where(eq(contactInquiries.id, inquiryId))
      .returning();

    return updated ?? null;
  }
}
