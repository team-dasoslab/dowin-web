import type { EventData, Options, Step, Styles } from "react-joyride";
import { STATUS } from "react-joyride";

export const SETUP_COACHMARK_STORAGE_KEY = "wig.setup.coachmark.v1.dismissed";

export const SETUP_COACHMARK_STEPS: Step[] = [
  {
    target: '[data-coachmark="setup-goal"]',
    title: "가중목 (가장 중요한 목표)",
    content:
      "좋은 가중목은 '무엇이 가장 중요한가'를 고르는 일입니다. 목표가 많으면 집중이 분산됩니다. 이번 기간에는 딱 1개만 정하세요.",
    skipBeacon: true,
  },
  {
    target: '[data-coachmark="setup-lag"]',
    title: "후행지표",
    content:
      "후행지표는 최종 결과를 보여주는 수치입니다. 가중목 달성 여부를 측정할 수 있는 지표를 '특정 일까지 X에서 Y로' 형식으로 작성하세요.",
  },
  {
    target: '[data-coachmark="setup-lead"]',
    title: "선행지표",
    content:
      "선행지표는 결과를 바꾸는 행동입니다. 예측 가능하고 내가 직접 통제할 수 있어야 합니다. 매일/매주 반복할 행동으로 적으세요.",
  },
];

export const SETUP_COACHMARK_OPTIONS: Partial<Options> = {
  buttons: ["back", "primary", "skip"],
  primaryColor: "rgba(94, 106, 210, 1)",
  backgroundColor: "rgba(255, 255, 255, 1)",
  textColor: "rgba(17, 24, 39, 1)",
  zIndex: 1100,
};

export const SETUP_COACHMARK_STYLES: Partial<Styles> = {
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
  buttonBack: {
    color: "rgba(75, 85, 99, 1)",
    fontFamily: "var(--font-pretendard)",
    fontWeight: 600,
    fontSize: "12px",
    lineHeight: "1.2",
    padding: "8px 10px",
    minHeight: "32px",
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

export function handleSetupCoachmarkEvent(
  data: EventData,
  setIsCoachmarkRunning: (value: boolean) => void,
) {
  if (data.status === STATUS.FINISHED || data.status === STATUS.SKIPPED) {
    localStorage.setItem(SETUP_COACHMARK_STORAGE_KEY, "1");
    setIsCoachmarkRunning(false);
  }
}
