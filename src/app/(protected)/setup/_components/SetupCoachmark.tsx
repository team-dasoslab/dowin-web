"use client";

import {
  SETUP_COACHMARK_LEAD_TAGS_QUERY,
  SETUP_COACHMARK_OPTIONS,
  SETUP_COACHMARK_STEPS,
  SETUP_COACHMARK_STYLES,
  SETUP_LEAD_TAGS_COACHMARK_STEPS,
  handleSetupCoachmarkEvent,
} from "@/app/(protected)/setup/_lib/setup-coachmark";
import { Joyride, type EventData } from "react-joyride";

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
  const handleEvent = (data: EventData) => {
    handleSetupCoachmarkEvent(data, setIsRunning, {
      persistDismissed: mode === "default",
    });
  };

  const steps =
    mode === SETUP_COACHMARK_LEAD_TAGS_QUERY
      ? SETUP_LEAD_TAGS_COACHMARK_STEPS
      : SETUP_COACHMARK_STEPS;

  return (
    <Joyride
      run={isRunning}
      steps={steps}
      onEvent={handleEvent}
      options={SETUP_COACHMARK_OPTIONS}
      styles={SETUP_COACHMARK_STYLES}
      continuous
      locale={{
        back: "이전",
        close: "닫기",
        last: "완료",
        next: "다음",
        skip: "건너뛰기",
      }}
    />
  );
}
