import type { EventData, Options, Step, Styles } from "react-joyride";
import { STATUS } from "react-joyride";

export const SETUP_COACHMARK_STORAGE_KEY = "dowin.setup.coachmark.v1.dismissed";
export const SETUP_COACHMARK_LEAD_TAGS_QUERY = "lead-measure-tags";

export const getSetupCoachmarkSteps = (t: (key: string) => string): Step[] => [
  {
    target: '[data-coachmark="setup-goal"]',
    title: t("goalTitle"),
    content: t("goalContent"),
    skipBeacon: true,
  },
  {
    target: '[data-coachmark="setup-lag"]',
    title: t("lagTitle"),
    content: t("lagContent"),
  },
  {
    target: '[data-coachmark="setup-lead"]',
    title: t("leadTitle"),
    content: t("leadContent"),
  },
];

export const getSetupLeadTagsCoachmarkSteps = (
  t: (key: string) => string,
): Step[] => [
  {
    target: '[data-coachmark="setup-lead-tags"]',
    title: t("tagsTitle"),
    content: t("tagsContent"),
    skipBeacon: true,
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
  options?: {
    persistDismissed?: boolean;
  },
) {
  if (data.status === STATUS.FINISHED || data.status === STATUS.SKIPPED) {
    if (options?.persistDismissed ?? true) {
      localStorage.setItem(SETUP_COACHMARK_STORAGE_KEY, "1");
    }
    setIsCoachmarkRunning(false);
  }
}
