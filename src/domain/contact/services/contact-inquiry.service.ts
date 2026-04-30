import { NotFoundError } from "@/lib/server/errors";
import { ContactInquiryRecord } from "@/domain/contact/storage/contact-inquiry.storage";

type WorkspacePort = {
  findUserWorkspace(
    userId: number,
  ): Promise<{ id: number; name: string } | null>;
};

type ContactInquiryPort = {
  create(input: {
    category: "GENERAL" | "BILLING" | "BUG_OR_ACCOUNT";
    subject: string;
    message: string;
    replyEmail: string;
    consentedAt: Date;
    locale: "ko" | "en";
    source: "CONTACT_PAGE";
    userId: number;
    workspaceId: number | null;
  }): Promise<ContactInquiryRecord>;
  updateDiscordDelivery(input: {
    inquiryId: number;
    status: "SENT" | "FAILED";
    failureReason?: string | null;
  }): Promise<ContactInquiryRecord | null>;
  listByUserId(userId: number): Promise<ContactInquiryRecord[]>;
  findByIdAndUserId(
    inquiryId: number,
    userId: number,
  ): Promise<ContactInquiryRecord | null>;
};

type ContactDiscordNotifierPort = {
  send(input: {
    webhookUrl: string;
    input: {
      inquiryId: number;
      category: "GENERAL" | "BILLING" | "BUG_OR_ACCOUNT";
      subject: string;
      message: string;
      replyEmail: string;
      locale: "ko" | "en";
      userId: number;
      workspaceId: number | null;
      workspaceName: string | null;
      createdAt: string;
    };
  }): Promise<unknown>;
};

export class ContactInquiryService {
  constructor(
    private workspaceStorage: WorkspacePort,
    private contactInquiryStorage: ContactInquiryPort,
    private contactDiscordNotifier: ContactDiscordNotifierPort,
  ) {}

  async createInquiry(
    userId: number,
    input: {
      category: "GENERAL" | "BILLING" | "BUG_OR_ACCOUNT";
      replyEmail: string;
      subject: string;
      message: string;
      locale: "ko" | "en";
    },
    options: {
      webhookUrl?: string | null;
    },
  ) {
    const workspace = await this.workspaceStorage.findUserWorkspace(userId);
    const created = await this.contactInquiryStorage.create({
      category: input.category,
      replyEmail: input.replyEmail.trim(),
      subject: input.subject.trim(),
      message: input.message.trim(),
      consentedAt: new Date(),
      locale: input.locale,
      source: "CONTACT_PAGE",
      userId,
      workspaceId: workspace?.id ?? null,
    });

    let finalRecord = created;

    try {
      if (!options.webhookUrl) {
        throw new Error("CONTACT_DISCORD_WEBHOOK_URL_MISSING");
      }

      await this.contactDiscordNotifier.send({
        webhookUrl: options.webhookUrl,
        input: {
          inquiryId: created.id,
          category: created.category,
          subject: created.subject,
          message: created.message,
          replyEmail: created.replyEmail,
          locale: created.locale,
          userId: created.userId,
          workspaceId: created.workspaceId ?? null,
          workspaceName: workspace?.name ?? null,
          createdAt: created.createdAt.toISOString(),
        },
      });

      finalRecord =
        (await this.contactInquiryStorage.updateDiscordDelivery({
          inquiryId: created.id,
          status: "SENT",
        })) ?? created;
    } catch (error) {
      finalRecord =
        (await this.contactInquiryStorage.updateDiscordDelivery({
          inquiryId: created.id,
          status: "FAILED",
          failureReason: toFailureReason(error),
        })) ?? created;
    }

    return toContactInquiryDto(finalRecord);
  }

  async listMyInquiries(userId: number) {
    const records = await this.contactInquiryStorage.listByUserId(userId);

    return records.map((record) => toContactInquiryDto(record, false));
  }

  async getMyInquiry(userId: number, inquiryId: number) {
    const record = await this.contactInquiryStorage.findByIdAndUserId(
      inquiryId,
      userId,
    );

    if (!record) {
      throw new NotFoundError("NOT_FOUND");
    }

    return toContactInquiryDto(record, true);
  }
}

function toContactInquiryDto(record: ContactInquiryRecord, includeMessage = true) {
  const dto = {
    id: record.id,
    category: record.category,
    status: record.status,
    replyEmail: record.replyEmail,
    subject: record.subject,
    source: record.source,
    userId: record.userId,
    workspaceId: record.workspaceId ?? null,
    answerSummary: record.answerSummary ?? null,
    answeredAt: record.answeredAt?.toISOString() ?? null,
    discordDeliveryStatus: record.discordDeliveryStatus,
    createdAt: record.createdAt.toISOString(),
  };

  if (!includeMessage) {
    return dto;
  }

  return {
    ...dto,
    message: record.message,
  };
}

function toFailureReason(error: unknown) {
  if (error instanceof Error) {
    return error.message.slice(0, 500);
  }

  return "UNKNOWN_DISCORD_DELIVERY_FAILURE";
}
