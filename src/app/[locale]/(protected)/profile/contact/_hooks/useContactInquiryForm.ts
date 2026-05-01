"use client";

import {
  ContactInquiryCreateRequestCategory,
  type ContactInquiryCreateRequest,
} from "@/api/generated/dowin.schemas";
import { useMemo, useState } from "react";
import { z } from "zod";

type ContactFieldErrors = Partial<
  Record<keyof ContactInquiryCreateRequest, string>
>;

type ContactFormTranslations = {
  invalidEmail: string;
  subjectRequired: string;
  subjectTooLong: string;
  messageRequired: string;
  messageTooLong: string;
  privacyConsentRequired: string;
};

const DEFAULT_FORM_VALUES: ContactInquiryCreateRequest = {
  category: ContactInquiryCreateRequestCategory.GENERAL,
  replyEmail: "",
  subject: "",
  message: "",
  privacyConsent: false,
};

export function useContactInquiryForm(messages: ContactFormTranslations) {
  const schema = useMemo(
    () =>
      z.object({
        category: z.enum([
          ContactInquiryCreateRequestCategory.GENERAL,
          ContactInquiryCreateRequestCategory.BILLING,
          ContactInquiryCreateRequestCategory.BUG_OR_ACCOUNT,
        ]),
        replyEmail: z
          .string()
          .trim()
          .email(messages.invalidEmail)
          .max(320, messages.invalidEmail),
        subject: z
          .string()
          .trim()
          .min(1, messages.subjectRequired)
          .max(120, messages.subjectTooLong),
        message: z
          .string()
          .trim()
          .min(1, messages.messageRequired)
          .max(5000, messages.messageTooLong),
        privacyConsent: z.boolean().refine((value) => value, {
          message: messages.privacyConsentRequired,
        }),
      }),
    [messages],
  );

  const [values, setValues] =
    useState<ContactInquiryCreateRequest>(DEFAULT_FORM_VALUES);
  const [errors, setErrors] = useState<ContactFieldErrors>({});

  const setField = <K extends keyof ContactInquiryCreateRequest>(
    key: K,
    value: ContactInquiryCreateRequest[K],
  ) => {
    setValues((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: undefined }));
  };

  const validate = () => {
    const parsed = schema.safeParse(values);

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setErrors({
        category: fieldErrors.category?.[0],
        replyEmail: fieldErrors.replyEmail?.[0],
        subject: fieldErrors.subject?.[0],
        message: fieldErrors.message?.[0],
        privacyConsent: fieldErrors.privacyConsent?.[0],
      });

      return null;
    }

    setErrors({});
    return parsed.data;
  };

  const reset = () => {
    setValues(DEFAULT_FORM_VALUES);
    setErrors({});
  };

  return {
    values,
    errors,
    setField,
    validate,
    reset,
  };
}
