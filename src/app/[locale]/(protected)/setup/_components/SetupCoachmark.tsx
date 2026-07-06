"use client";

import { useSetupCoachmarkEventHook } from "@/app/[locale]/(protected)/setup/_hooks/useSetupCoachmarkEventHook";
import {
  SETUP_COACHMARK_LEAD_TAGS_QUERY,
  SETUP_COACHMARK_OPTIONS,
  SETUP_COACHMARK_STYLES,
  getSetupCoachmarkSteps,
  getSetupLeadTagsCoachmarkSteps,
} from "@/app/[locale]/(protected)/setup/_lib/setup-coachmark";
import { useTranslations } from "next-intl";
import { Joyride } from "react-joyride";

interface SetupCoachmarkProps {
  mode?: "default" | typeof SETUP_COACHMARK_LEAD_TAGS_QUERY;
  isRunning: boolean;
  setIsRunning: (value: boolean) => void;
}

export function SetupCoachmark({
  isRunning,
  mode = "default",
  setIsRunning,
}: SetupCoachmarkProps) {
  const t = useTranslations("Setup.Coachmark");

  const { handleEvent } = useSetupCoachmarkEventHook(mode, setIsRunning);

  const steps =
    mode === SETUP_COACHMARK_LEAD_TAGS_QUERY
      ? getSetupLeadTagsCoachmarkSteps(t)
      : getSetupCoachmarkSteps(t);

  return (
    <Joyride
      run={isRunning}
      steps={steps}
      onEvent={handleEvent}
      options={SETUP_COACHMARK_OPTIONS}
      styles={SETUP_COACHMARK_STYLES}
      continuous
      locale={{
        back: t("back"),
        close: t("close"),
        last: t("last"),
        next: t("next"),
        skip: t("skip"),
      }}
    />
  );
}
