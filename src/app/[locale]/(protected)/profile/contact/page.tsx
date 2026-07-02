"use client";

import { Dialog, DialogContent } from "@/components/ui/Dialog";
import { useGetContactInquiries } from "@/api/generated/contact/contact";
import {
  ContactInquiryCreateRequestCategory,
  ContactInquirySummaryStatus,
  type ContactInquiryDetail,
  type ContactInquirySummary,
} from "@/api/generated/dowin.schemas";
import {
  ProtectedPageContainer,
  ProtectedPageHeader,
} from "@/app/[locale]/(protected)/_components/ProtectedPageShell";
import { Button } from "@/components/ui/Button";
import { DowinIcon } from "@/components/ui/DowinIcon";
import { getApiErrorStatus } from "@/lib/client/frontend-api";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useContactInquiryForm } from "./_hooks/useContactInquiryForm";
import { useContactInquiryMutation } from "./_hooks/useContactInquiryMutation";

export default function ProfileContactPage() {
  const t = useTranslations("ProfileContact");
  const locale = useLocale();
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const listQuery = useGetContactInquiries({
    query: {
      retry: false,
    },
  });

  const inquiries = useMemo(
    () => (listQuery.data?.status === 200 ? listQuery.data.data : []),
    [listQuery.data],
  );

  const listStatusCode =
    listQuery.data?.status ?? getApiErrorStatus(listQuery.error);

  return (
    <>
      <div className="min-h-screen">
        <ProtectedPageContainer className="max-w-[760px] pb-24 md:pb-10 lg:pb-12">
          <ProtectedPageHeader
            className="flex-row items-center justify-between"
            title={t("listTitle")}
            rightElement={
              <Button
                type="button"
                onClick={() => {
                  setIsComposerOpen(true);
                }}
                variant="primary"
                size="sm"
                className="font-black"
              >
                {t("composeButton")}
              </Button>
            }
          />

          <section className="space-y-4">
            {listQuery.isLoading ? (
              <InquiryListSkeleton />
            ) : listStatusCode === 401 ? (
              <ListStatusCard
                title={t("unauthorizedTitle")}
                description={t("unauthorizedDescription")}
              />
            ) : listStatusCode && listStatusCode >= 500 ? (
              <ListStatusCard
                title={t("listErrorTitle")}
                description={t("listErrorDescription")}
                actionLabel={t("retryButton")}
                onAction={() => void listQuery.refetch()}
              />
            ) : inquiries.length === 0 ? (
              <ListStatusCard
                title={t("emptyTitle")}
                description={t("emptyDescription")}
              />
            ) : (
              <div className="grid gap-3">
                {inquiries.map((inquiry) => (
                  <InquiryCard
                    key={inquiry.id}
                    inquiry={inquiry}
                    t={t}
                    locale={locale}
                  />
                ))}
              </div>
            )}
          </section>
        </ProtectedPageContainer>
      </div>

      <ContactInquiryComposer
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        onSubmitted={() => {
          setIsComposerOpen(false);
          void listQuery.refetch();
        }}
      />
    </>
  );
}

function ContactInquiryComposer({
  isOpen,
  onClose,
  onSubmitted,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: (inquiry: ContactInquiryDetail) => void;
}) {
  const t = useTranslations("ContactPage");
  const form = useContactInquiryForm({
    invalidEmail: t("errors.invalidEmail"),
    subjectRequired: t("errors.subjectRequired"),
    subjectTooLong: t("errors.subjectTooLong"),
    messageRequired: t("errors.messageRequired"),
    messageTooLong: t("errors.messageTooLong"),
    privacyConsentRequired: t("errors.privacyConsentRequired"),
  });
  const { isSubmitting, submit } = useContactInquiryMutation({
    onSubmitted: (inquiry) => {
      onSubmitted(inquiry);
      form.reset();
    },
  });

  if (!isOpen) {
    return null;
  }

  const categories = [
    {
      value: ContactInquiryCreateRequestCategory.GENERAL,
      label: t("categoryOptions.general"),
    },
    {
      value: ContactInquiryCreateRequestCategory.BILLING,
      label: t("categoryOptions.billing"),
    },
    {
      value: ContactInquiryCreateRequestCategory.BUG_OR_ACCOUNT,
      label: t("categoryOptions.bugOrAccount"),
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-full max-w-[640px] overflow-hidden p-0">
        <div className="relative w-full flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-6 py-5">
            <div>
              <p className="text-[11px] font-black tracking-[0.2em] text-primary uppercase">
                {t("badge")}
              </p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-text-primary">
                {t("formTitle")}
              </h2>
            </div>
            <Button
              type="button"
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full p-0"
            >
              <DowinIcon name="action-dismiss" size="24px" />
            </Button>
          </div>

          {/* Form Content */}
          <div className="max-h-[60vh] overflow-y-auto px-6 py-8 md:px-8">
            <form
              id="contact-inquiry-form"
              onSubmit={async (event) => {
                event.preventDefault();
                const parsed = form.validate();
                if (!parsed) return;
                await submit(parsed);
              }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <label className="block text-[13px] font-bold text-text-primary">
                  {t("categoryLabel")}{" "}
                  <span className="text-danger">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category.value}
                      type="button"
                      onClick={() =>
                        form.setField("category", category.value)
                      }
                      className={`h-11 rounded-[16px] px-4 text-sm font-bold transition-all ${
                        form.values.category === category.value
                          ? "bg-text-primary text-white"
                          : "bg-sub-background text-text-secondary hover:bg-border/50"
                      }`}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
                <FieldError message={form.errors.category} />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="replyEmail"
                  className="block text-[13px] font-bold text-text-primary"
                >
                  {t("replyEmailLabel")}{" "}
                  <span className="text-danger">*</span>
                </label>
                <input
                  id="replyEmail"
                  type="email"
                  value={form.values.replyEmail}
                  onChange={(e) =>
                    form.setField("replyEmail", e.target.value)
                  }
                  className="h-12 w-full rounded-[16px] border border-border bg-surface px-4 text-sm text-text-primary outline-none transition-colors focus:border-text-primary"
                  placeholder={t("replyEmailPlaceholder")}
                  autoComplete="email"
                />
                <p className="text-[12px] text-text-muted">
                  {t("replyEmailHint")}
                </p>
                <FieldError message={form.errors.replyEmail} />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="subject"
                  className="block text-[13px] font-bold text-text-primary"
                >
                  {t("subjectLabel")}{" "}
                  <span className="text-danger">*</span>
                </label>
                <input
                  id="subject"
                  type="text"
                  value={form.values.subject}
                  onChange={(e) =>
                    form.setField("subject", e.target.value)
                  }
                  className="h-12 w-full rounded-[16px] border border-border bg-surface px-4 text-sm text-text-primary outline-none transition-colors focus:border-text-primary"
                  placeholder={t("subjectPlaceholder")}
                  maxLength={100}
                />
                <FieldError message={form.errors.subject} />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="message"
                  className="block text-[13px] font-bold text-text-primary"
                >
                  {t("messageLabel")}{" "}
                  <span className="text-danger">*</span>
                </label>
                <textarea
                  id="message"
                  value={form.values.message}
                  onChange={(e) =>
                    form.setField("message", e.target.value)
                  }
                  className="min-h-[160px] w-full resize-y rounded-[20px] border border-border bg-surface p-4 text-sm leading-relaxed text-text-primary outline-none transition-colors focus:border-text-primary"
                  placeholder={t("messagePlaceholder")}
                  maxLength={3000}
                />
                <FieldError message={form.errors.message} />
              </div>

              <div className="space-y-3 rounded-[20px] bg-sub-background p-5">
                <label className="flex items-start gap-3">
                  <div className="flex h-5 items-center">
                    <input
                      type="checkbox"
                      checked={form.values.privacyConsent}
                      onChange={(e) =>
                        form.setField("privacyConsent", e.target.checked)
                      }
                      className="h-4 w-4 rounded border-border text-primary outline-none focus:ring-0"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[14px] font-black tracking-tight text-text-primary">
                      {t("privacyConsentTitle")}
                    </p>
                    <p className="text-[12px] leading-5 text-text-muted whitespace-pre-line">
                      {t("privacyConsentBody")}
                    </p>
                  </div>
                </label>
                <FieldError message={form.errors.privacyConsent} />
              </div>
            </form>
          </div>

          {/* Actions - Fixed at bottom */}
          <div className="border-t border-border bg-surface px-6 py-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] md:px-8 md:py-6">
            <div className="flex flex-row gap-3">
              <Button
                form="contact-inquiry-form"
                type="submit"
                disabled={
                  isSubmitting ||
                  !form.values.category ||
                  !form.values.replyEmail ||
                  !form.values.subject ||
                  !form.values.message ||
                  !form.values.privacyConsent
                }
                variant="primary"
                size="lg"
                className="flex-1 tracking-tight disabled:bg-border disabled:text-text-muted"
              >
                {isSubmitting ? t("submittingButton") : t("submitButton")}
              </Button>
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                size="lg"
                className="flex-1 tracking-tight"
              >
                {t("cancelButton")}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StatusPill({
  status,
  t,
}: {
  status: ContactInquirySummary["status"];
  t: ReturnType<typeof useTranslations<"ProfileContact">>;
}) {
  const statusClassName =
    status === ContactInquirySummaryStatus.RESOLVED
      ? "bg-success/10 text-success"
      : status === ContactInquirySummaryStatus.IN_PROGRESS
        ? "bg-primary/10 text-primary"
        : "bg-sub-background text-text-secondary";

  return (
    <span
      className={`inline-flex items-center h-6 rounded-[8px] px-2.5 text-[10px] font-black tracking-wide ${statusClassName}`}
    >
      {t(`status.${status}`)}
    </span>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-[12px] font-bold text-danger">{message}</p>;
}

function ListStatusCard({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="rounded-[24px] bg-surface p-8 text-center">
      <div className="mx-auto max-w-[440px] space-y-3">
        <h3 className="text-lg font-black tracking-tight text-text-primary">
          {title}
        </h3>
        <p className="text-sm leading-6 text-text-muted">{description}</p>
        {actionLabel && onAction ? (
          <div className="pt-2">
            <Button
              type="button"
              onClick={onAction}
              variant="primary"
              size="sm"
            >
              {actionLabel}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function InquiryListSkeleton() {
  return (
    <div className="grid gap-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="animate-pulse rounded-[24px] bg-surface p-4">
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="h-6 w-20 rounded-full bg-border" />
              <div className="h-6 w-24 rounded-full bg-border" />
            </div>
            <div className="h-5 w-3/5 rounded bg-border" />
            <div className="h-4 w-4/5 rounded bg-border" />
          </div>
        </div>
      ))}
    </div>
  );
}

function CategoryPill({
  category,
  t,
}: {
  category: ContactInquirySummary["category"];
  t: ReturnType<typeof useTranslations<"ProfileContact">>;
}) {
  return (
    <span className="inline-flex items-center h-6 rounded-[8px] bg-primary/5 px-2.5 text-[10px] font-black tracking-wide text-primary">
      {getCategoryLabel(category, t)}
    </span>
  );
}

function getCategoryLabel(
  category: ContactInquirySummary["category"],
  t: ReturnType<typeof useTranslations<"ProfileContact">>,
) {
  if (category === ContactInquiryCreateRequestCategory.BILLING) {
    return t("category.billing");
  }

  if (category === ContactInquiryCreateRequestCategory.BUG_OR_ACCOUNT) {
    return t("category.bugOrAccount");
  }

  return t("category.general");
}

function formatDateTime(value: string | null, locale: string) {
  if (!value) {
    return "-";
  }

  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function InquiryCard({
  inquiry,
  t,
  locale,
}: {
  inquiry: ContactInquirySummary;
  t: ReturnType<typeof useTranslations<"ProfileContact">>;
  locale: string;
}) {
  return (
    <div className="w-full rounded-[24px] bg-surface p-5 text-left transition">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <CategoryPill category={inquiry.category} t={t} />
            <StatusPill status={inquiry.status} t={t} />
          </div>
          <p className="text-[15px] font-black tracking-tight text-text-primary break-words">
            {inquiry.subject}
          </p>

          {inquiry.message ? (
            <div className="mt-3 space-y-1">
              <span className="text-[11px] font-black text-text-secondary tracking-wide uppercase select-none">
                {t("myMessage")}
              </span>
              <p className="text-sm font-medium leading-6 text-text-secondary whitespace-pre-wrap">
                {inquiry.message}
              </p>
            </div>
          ) : null}

          <div className="mt-3 space-y-1">
            <span className="text-[11px] font-black text-primary tracking-wide uppercase select-none">
              {t("answerLabel")}
            </span>
            <p className="text-sm font-medium leading-6 text-text-secondary whitespace-pre-wrap">
              {inquiry.answerSummary?.trim()
                ? inquiry.answerSummary
                : t("answerPending")}
            </p>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-xs font-bold text-text-muted">#{inquiry.id}</p>
          <p className="mt-1 text-xs font-medium text-text-muted">
            {formatDateTime(inquiry.createdAt, locale)}
          </p>
        </div>
      </div>
    </div>
  );
}
