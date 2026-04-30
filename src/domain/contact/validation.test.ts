import {
  contactInquiryCreateSchema,
  contactInquiryIdParamsSchema,
} from "@/domain/contact/validation";
import { describe, expect, it } from "vitest";

describe("contactInquiryCreateSchema", () => {
  it("유효한 문의 입력을 통과시킨다", () => {
    const result = contactInquiryCreateSchema.safeParse({
      category: "GENERAL",
      replyEmail: "user@example.com",
      subject: "로그인이 안 됩니다",
      message: "세션이 자주 끊깁니다.",
      privacyConsent: true,
    });

    expect(result.success).toBe(true);
  });

  it("개인정보 동의가 없으면 실패한다", () => {
    const result = contactInquiryCreateSchema.safeParse({
      category: "GENERAL",
      replyEmail: "user@example.com",
      subject: "제목",
      message: "내용",
      privacyConsent: false,
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.privacyConsent).toEqual(
      expect.arrayContaining([
        "문의 접수를 위해 개인정보 수집·이용 동의가 필요합니다.",
      ]),
    );
  });

  it("문의 id path params를 파싱한다", () => {
    const result = contactInquiryIdParamsSchema.safeParse({
      id: "7",
    });

    expect(result.success).toBe(true);

    if (!result.success) {
      throw new Error("expected id params parse to succeed");
    }

    expect(result.data.id).toBe(7);
  });
});
