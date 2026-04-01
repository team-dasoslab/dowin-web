"use client";

import {
  SETUP_COACHMARK_OPTIONS,
  SETUP_COACHMARK_STEPS,
  SETUP_COACHMARK_STYLES,
  handleSetupCoachmarkEvent,
} from "@/app/(protected)/setup/_lib/setup-coachmark";
import { Joyride, type EventData } from "react-joyride";

interface SetupCoachmarkProps {
  isRunning: boolean;
  setIsRunning: (value: boolean) => void;
}

export function SetupCoachmark({
  isRunning,
  setIsRunning,
}: SetupCoachmarkProps) {
  const handleEvent = (data: EventData) => {
    handleSetupCoachmarkEvent(data, setIsRunning);
  };

  return (
    <Joyride
      run={isRunning}
      steps={SETUP_COACHMARK_STEPS}
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
