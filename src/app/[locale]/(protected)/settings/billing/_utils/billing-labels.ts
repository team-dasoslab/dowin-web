import { useTranslations } from "next-intl";

export type EntitlementSource =
  | "POLAR"
  | "MANUAL_GRANT"
  | "PARTNER"
  | "INTERNAL_TEST"
  | "BETA_PROMOTIONAL_GRANT"
  | null;

export function getPeriodEndLabelKey(status?: string | null) {
  switch (status) {
    case "ACTIVE":
      return "nextRenewalLabel" as const;
    case "CANCELED":
      return "scheduledEndLabel" as const;
    case "EXPIRED":
    case "REVOKED":
      return "periodEndedLabel" as const;
    default:
      return "currentPeriodEndLabel" as const;
  }
}

export function getEntitlementSourceLabel(
  source: EntitlementSource,
  t: ReturnType<typeof useTranslations<"ProfileBilling">>,
) {
  switch (source) {
    case "POLAR":
      return t("entitlementSourcePolar");
    case "MANUAL_GRANT":
      return t("entitlementSourceManualGrant");
    case "PARTNER":
      return t("entitlementSourcePartner");
    case "INTERNAL_TEST":
      return t("entitlementSourceInternalTest");
    case "BETA_PROMOTIONAL_GRANT":
      return t("entitlementSourceBetaPromotionalGrant");
    default:
      return t("notAvailable");
  }
}
