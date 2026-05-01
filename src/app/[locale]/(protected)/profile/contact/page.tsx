"use client";

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
import { Card } from "@/components/ui/Card";
import { DowinIcon } from "@/components/ui/DowinIcon";
import { Input } from "@/components/ui/Input";
import { getApiErrorStatus } from "@/lib/client/frontend-api";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
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
      <div className="min-h-screen bg-zinc-50/50">
        <ProtectedPageContainer className="space-y-6 lg:space-y-8">
          <ProtectedPageHeader
            title={t("listTitle")}
            rightElement={
              <Button
                type="button"
                onClick={() => {
                  setIsComposerOpen(true);
                }}
                className="h-10 bg-primary px-4 text-sm font-black text-white"
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

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

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
    <Portal>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <button
          type="button"
          className="absolute inset-0 bg-black/55 backdrop-blur-[1px]"
          onClick={onClose}
          aria-label={t("cancelButton")}
        />
        <div className="relative w-full max-w-[640px] overflow-hidden rounded-[28px] bg-white border border-zinc-100 md:rounded-content">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-5">
            <div>
              <p className="text-[11px] font-black tracking-[0.2em] text-primary uppercase">
                {t("badge")}
              </p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-zinc-900">
                {t("formTitle")}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-400 transition-colors"
            >
              <DowinIcon name="action-dismiss" size="24px" />
            </button>
          </div>

          {/* Form Content */}
          <div className="max-h-[60vh] overflow-y-auto px-6 py-8 md:px-8">
            <form
              id="contact-inquiry-form"
              className="space-y-8"
              onSubmit={async (event) => {
                event.preventDefault();
                const parsed = form.validate();
                if (!parsed) return;
                await submit(parsed);
              }}
            >
              {/* Category Selection */}
              <div className="space-y-3">
                <span className="text-[13px] font-black tracking-wide text-zinc-900">
                  {t("categoryLabel")}
                </span>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => {
                    const isSelected = form.values.category === category.value;
                    return (
                      <button
                        key={category.value}
                        type="button"
                        disabled={isSubmitting}
                        onClick={() =>
                          form.setField("category", category.value)
                        }
                        className={`inline-flex items-center justify-center h-10 rounded-button px-5 text-[13px] font-bold transition-all active:scale-[0.98] ${
                          isSelected
                            ? "bg-primary border border-primary text-white"
                            : "bg-white border border-zinc-200 text-zinc-500"
                        }`}
                      >
                        {category.label}
                      </button>
                    );
                  })}
                </div>
                <FieldError message={form.errors.category} />
              </div>

              {/* Reply Email */}
              <div className="flex flex-col gap-2.5">
                <label className="text-[13px] font-black tracking-wide text-zinc-900">
                  {t("replyEmailLabel")}
                </label>
                <Input
                  type="email"
                  value={form.values.replyEmail}
                  onChange={(event) =>
                    form.setField("replyEmail", event.target.value)
                  }
                  placeholder={t("replyEmailPlaceholder")}
                  disabled={isSubmitting}
                  className="h-12 w-full rounded-button border border-zinc-200 bg-zinc-50/50 px-4 text-[14px] font-bold text-zinc-900 outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/5"
                />
                <FieldError message={form.errors.replyEmail} />
              </div>

              {/* Subject */}
              <div className="flex flex-col gap-2.5">
                <label className="text-[13px] font-black tracking-wide text-zinc-900">
                  {t("subjectLabel")}
                </label>
                <Input
                  value={form.values.subject}
                  onChange={(event) =>
                    form.setField("subject", event.target.value)
                  }
                  placeholder={t("subjectPlaceholder")}
                  disabled={isSubmitting}
                  className="h-12 w-full rounded-button border border-zinc-200 bg-zinc-50/50 px-4 text-[14px] font-bold text-zinc-900 outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/5"
                />
                <FieldError message={form.errors.subject} />
              </div>

              {/* Message */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[13px] font-black tracking-wide text-zinc-900">
                    {t("messageLabel")}
                  </label>
                  <span className="text-[12px] font-bold text-zinc-400">
                    {t("messageCount", {
                      count: form.values.message.length,
                    })}
                  </span>
                </div>
                <textarea
                  value={form.values.message}
                  onChange={(event) =>
                    form.setField("message", event.target.value)
                  }
                  placeholder={t("messagePlaceholder")}
                  disabled={isSubmitting}
                  rows={8}
                  className="min-h-[160px] w-full rounded-content border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-[14px] font-bold leading-6 text-zinc-900 outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/5"
                />
                <FieldError message={form.errors.message} />
              </div>

              {/* Notice & Privacy */}
              <div className="space-y-4">
                <div className="rounded-content border border-zinc-100 bg-zinc-50/70 p-5">
                  <div className="space-y-3 text-[13px] leading-6 text-zinc-500">
                    <p className="font-black text-zinc-900">
                      {t("noticeTitle")}
                    </p>
                    <ul className="list-disc space-y-1 pl-4">
                      <li>{t("noticeBody1")}</li>
                      <li>{t("noticeBody2")}</li>
                    </ul>
                  </div>
                </div>

                <label className="flex items-start gap-3 rounded-content border border-zinc-200 bg-zinc-50/50 p-4 transition-colors">
                  <input
                    type="checkbox"
                    checked={form.values.privacyConsent}
                    onChange={(event) =>
                      form.setField("privacyConsent", event.target.checked)
                    }
                    disabled={isSubmitting}
                    className="mt-1 h-4 w-4 rounded border-zinc-300 text-primary focus:ring-primary"
                  />
                  <div className="space-y-1">
                    <p className="text-[14px] font-black tracking-tight text-zinc-900">
                      {t("privacyConsentTitle")}
                    </p>
                    <p className="text-[12px] leading-5 text-zinc-500 whitespace-pre-line">
                      {t("privacyConsentBody")}
                    </p>
                  </div>
                </label>
                <FieldError message={form.errors.privacyConsent} />
              </div>
            </form>
          </div>

          {/* Actions - Fixed at bottom */}
          <div className="border-t border-zinc-100 bg-white px-6 py-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] md:px-8 md:py-6">
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
                className="inline-flex h-14 flex-1 items-center justify-center bg-primary text-[16px] font-black tracking-tight text-white disabled:cursor-not-allowed disabled:bg-zinc-200"
              >
                {isSubmitting ? t("submittingButton") : t("submitButton")}
              </Button>
              <Button
                type="button"
                onClick={onClose}
                className="inline-flex h-14 flex-1 items-center justify-center border border-zinc-200 bg-white text-[16px] font-black tracking-tight text-zinc-600"
              >
                {t("cancelButton")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}

function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted ? createPortal(children, document.body) : null;
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
      ? "border-success/20 bg-success/10 text-success"
      : status === ContactInquirySummaryStatus.IN_PROGRESS
        ? "border-primary/20 bg-primary/10 text-primary"
        : "border-zinc-200 bg-zinc-100 text-zinc-600";

  return (
    <span
      className={`inline-flex items-center h-6 rounded-button border px-2.5 text-[10px] font-black tracking-wide ${statusClassName}`}
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
    <Card className="border-zinc-200 bg-white p-8 text-center">
      <div className="mx-auto max-w-[440px] space-y-3">
        <h3 className="text-lg font-black tracking-tight text-zinc-900">
          {title}
        </h3>
        <p className="text-sm leading-6 text-zinc-500">{description}</p>
        {actionLabel && onAction ? (
          <div className="pt-2">
            <Button
              type="button"
              onClick={onAction}
              className="h-10 bg-primary px-4 text-sm font-black text-white"
            >
              {actionLabel}
            </Button>
          </div>
        ) : null}
      </div>
    </Card>
  );
}

function InquiryListSkeleton() {
  return (
    <div className="grid gap-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <Card
          key={index}
          className="animate-pulse border-zinc-200 bg-white p-4"
        >
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="h-6 w-20 rounded-full bg-zinc-100" />
              <div className="h-6 w-24 rounded-full bg-zinc-100" />
            </div>
            <div className="h-5 w-3/5 rounded bg-zinc-100" />
            <div className="h-4 w-4/5 rounded bg-zinc-100" />
          </div>
        </Card>
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
    <span className="inline-flex items-center h-6 rounded-button bg-primary/5 border border-primary/10 px-2.5 text-[10px] font-black tracking-wide text-primary">
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
    <div className="w-full rounded-content border border-zinc-200 bg-white p-4 text-left transition">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <CategoryPill category={inquiry.category} t={t} />
            <StatusPill status={inquiry.status} t={t} />
          </div>
          <p className="text-[15px] font-black tracking-tight text-zinc-900 break-words">
            {inquiry.subject}
          </p>

          {inquiry.message ? (
            <div className="mt-3 space-y-1">
              <span className="text-[11px] font-black text-zinc-700 tracking-wide uppercase select-none">
                {t("myMessage")}
              </span>
              <p className="text-sm font-medium leading-6 text-zinc-600 whitespace-pre-wrap">
                {inquiry.message}
              </p>
            </div>
          ) : null}

          <div className="mt-3 space-y-1">
            <span className="text-[11px] font-black text-primary tracking-wide uppercase select-none">
              {t("answerLabel")}
            </span>
            <p className="text-sm font-medium leading-6 text-zinc-700 whitespace-pre-wrap">
              {inquiry.answerSummary?.trim()
                ? inquiry.answerSummary
                : t("answerPending")}
            </p>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-xs font-bold text-zinc-400">#{inquiry.id}</p>
          <p className="mt-1 text-xs font-medium text-zinc-500">
            {formatDateTime(inquiry.createdAt, locale)}
          </p>
        </div>
      </div>
    </div>
  );
}
