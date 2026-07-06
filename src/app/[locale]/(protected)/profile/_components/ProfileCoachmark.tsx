"use client";

import { useProfileCoachmarkEvent } from "@/app/[locale]/(protected)/profile/_hooks/useProfileCoachmarkEvent";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Joyride, type Options, type Step, type Styles } from "react-joyride";

export const PROFILE_COACHMARK_PERSONAL_REMINDER_QUERY = "personal-reminder";

const PROFILE_COACHMARK_OPTIONS: Partial<Options> = {
  buttons: ["primary", "skip"],
  primaryColor: "var(--color-primary)",
  backgroundColor: "rgba(255, 255, 255, 1)",
  textColor: "rgba(17, 24, 39, 1)",
  zIndex: 1100,
};

const PROFILE_COACHMARK_STYLES: Partial<Styles> = {
  tooltip: {
    borderRadius: 12,
  },
  tooltipContainer: {},
  tooltipTitle: {
    fontSize: "14px",
    fontWeight: 700,
    color: "rgba(17, 24, 39, 1)",
  },
  tooltipContent: {
    fontSize: "13px",
    lineHeight: "1.55",
    color: "rgba(75, 85, 99, 1)",
  },
  buttonPrimary: {
    backgroundColor: "var(--color-primary)",
    borderRadius: 8,
    color: "#fff",
    fontWeight: 700,
    fontSize: "12px",
    lineHeight: "1.2",
    padding: "8px 12px",
    minHeight: "32px",
    minWidth: "auto",
    border: "1px solid rgba(0, 0, 0, 0.05)",
  },
  buttonSkip: {
    color: "rgba(156, 163, 175, 1)",
    fontWeight: 600,
    fontSize: "12px",
    lineHeight: "1.2",
    padding: "8px 10px",
    minHeight: "32px",
  },
};

type ProfileCoachmarkProps = {
  isRunning: boolean;
  setIsRunning: (value: boolean) => void;
};

export function ProfileCoachmark({
  isRunning,
  setIsRunning,
}: ProfileCoachmarkProps) {
  const t = useTranslations("Profile.Coachmark");

  const steps = useMemo<Step[]>(
    () => [
      {
        target: '[data-coachmark="profile-personal-reminder"]',
        title: t("personalReminderTitle"),
        content: t("personalReminderContent"),
        placement: "bottom",
        skipBeacon: true,
      },
    ],
    [t],
  );

  const { handleEvent } = useProfileCoachmarkEvent(setIsRunning);

  return (
    <Joyride
      run={isRunning}
      steps={steps}
      onEvent={handleEvent}
      options={PROFILE_COACHMARK_OPTIONS}
      styles={PROFILE_COACHMARK_STYLES}
      continuous
      locale={{
        close: t("close"),
        last: t("last"),
        next: t("next"),
        skip: t("skip"),
      }}
    />
  );
}
