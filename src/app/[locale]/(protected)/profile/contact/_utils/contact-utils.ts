import {
  ContactInquiryCreateRequestCategory,
  ContactInquirySummary,
} from "@/api/generated/dowin.schemas";

export function getCategoryLabel(
  category: ContactInquirySummary["category"],
  t: (key: string) => string,
) {
  if (category === ContactInquiryCreateRequestCategory.BILLING) {
    return t("category.billing");
  }

  if (category === ContactInquiryCreateRequestCategory.BUG_OR_ACCOUNT) {
    return t("category.bugOrAccount");
  }

  return t("category.general");
}
