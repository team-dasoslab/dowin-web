"use client";

import { Joyride, STATUS, type EventData, type Options, type Step, type Styles } from "react-joyride";

export const PROFILE_COACHMARK_PERSONAL_REMINDER_QUERY = "personal-reminder";

const PROFILE_COACHMARK_STEPS: Step[] = [
  {
    target: '[data-coachmark="profile-personal-reminder"]',
    title: "개인 기록 리마인드",
    content:
      "여기서 푸시 알림을 켜고 시간을 고르면, 매일 원하는 시각에 기록 리마인드를 받을 수 있어요.",
    placement: "bottom",
    skipBeacon: true,
  },
];

const PROFILE_COACHMARK_OPTIONS: Partial<Options> = {
  buttons: ["primary", "skip"],
  primaryColor: "rgba(94, 106, 210, 1)",
  backgroundColor: "rgba(255, 255, 255, 1)",
  textColor: "rgba(17, 24, 39, 1)",
  zIndex: 1100,
};

const PROFILE_COACHMARK_STYLES: Partial<Styles> = {
  tooltip: {
    borderRadius: 12,
  },
  tooltipContainer: {
    fontFamily: "var(--font-pretendard)",
  },
  tooltipTitle: {
    fontFamily: "var(--font-pretendard)",
    fontSize: "14px",
    fontWeight: 700,
    color: "rgba(17, 24, 39, 1)",
  },
  tooltipContent: {
    fontFamily: "var(--font-pretendard)",
    fontSize: "13px",
    lineHeight: "1.55",
    color: "rgba(75, 85, 99, 1)",
  },
  buttonPrimary: {
    backgroundColor: "rgba(94, 106, 210, 1)",
    borderRadius: 8,
    color: "#fff",
    fontFamily: "var(--font-pretendard)",
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
    fontFamily: "var(--font-pretendard)",
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
  const handleEvent = (data: EventData) => {
    if (data.status === STATUS.FINISHED || data.status === STATUS.SKIPPED) {
      setIsRunning(false);
    }
  };

  return (
    <Joyride
      run={isRunning}
      steps={PROFILE_COACHMARK_STEPS}
      onEvent={handleEvent}
      options={PROFILE_COACHMARK_OPTIONS}
      styles={PROFILE_COACHMARK_STYLES}
      continuous
      locale={{
        close: "닫기",
        last: "완료",
        next: "다음",
        skip: "건너뛰기",
      }}
    />
  );
}
