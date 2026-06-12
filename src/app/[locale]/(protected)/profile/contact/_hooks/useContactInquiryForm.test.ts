import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ContactInquiryCreateRequestCategory } from "@/api/generated/dowin.schemas";

import { useContactInquiryForm } from "./useContactInquiryForm";

const messages = {
  invalidEmail: "Invalid email",
  subjectRequired: "Subject required",
  subjectTooLong: "Subject too long",
  messageRequired: "Message required",
  messageTooLong: "Message too long",
  privacyConsentRequired: "Consent required",
};

describe("useContactInquiryForm", () => {
  it("starts with default inquiry values", () => {
    const { result } = renderHook(() => useContactInquiryForm(messages));

    expect(result.current.values).toEqual({
      category: ContactInquiryCreateRequestCategory.GENERAL,
      replyEmail: "",
      subject: "",
      message: "",
      privacyConsent: false,
    });
    expect(result.current.errors).toEqual({});
  });

  it("returns field errors for invalid input", () => {
    const { result } = renderHook(() => useContactInquiryForm(messages));

    act(() => {
      result.current.setField("replyEmail", "not-an-email");
    });

    act(() => {
      expect(result.current.validate()).toBeNull();
    });

    expect(result.current.errors).toMatchObject({
      replyEmail: "Invalid email",
      subject: "Subject required",
      message: "Message required",
      privacyConsent: "Consent required",
    });
  });

  it("trims valid fields and clears field errors on change", () => {
    const { result } = renderHook(() => useContactInquiryForm(messages));

    act(() => {
      result.current.validate();
    });
    expect(result.current.errors.subject).toBe("Subject required");

    act(() => {
      result.current.setField("category", ContactInquiryCreateRequestCategory.BUG_OR_ACCOUNT);
      result.current.setField("replyEmail", "  person@example.com  ");
      result.current.setField("subject", "  Need help  ");
      result.current.setField("message", "  Something broke  ");
      result.current.setField("privacyConsent", true);
    });
    expect(result.current.errors.subject).toBeUndefined();

    let parsed: ReturnType<typeof result.current.validate> = null;
    act(() => {
      parsed = result.current.validate();
    });
    expect(parsed).toEqual({
      category: ContactInquiryCreateRequestCategory.BUG_OR_ACCOUNT,
      replyEmail: "person@example.com",
      subject: "Need help",
      message: "Something broke",
      privacyConsent: true,
    });
  });

  it("resets values and errors", () => {
    const { result } = renderHook(() => useContactInquiryForm(messages));

    act(() => {
      result.current.setField("replyEmail", "person@example.com");
      result.current.validate();
      result.current.reset();
    });

    expect(result.current.values.replyEmail).toBe("");
    expect(result.current.errors).toEqual({});
  });
});
