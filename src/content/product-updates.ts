export const PRODUCT_UPDATE_TAGS = [
  "Dashboard",
  "Home",
  "Profile",
  "Setup",
  "Workspace",
  "Quality of Life",
] as const;

export type ProductUpdateTag = (typeof PRODUCT_UPDATE_TAGS)[number];

export type ProductUpdate = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  publishedAt: string;
  tag: ProductUpdateTag;
  ctaLabel: "바로 써보기";
  ctaHref: string;
  isMajor: boolean;
  plan?: "BASIC" | "FREE" | "STANDARD";
};

/**
 * LLM-friendly authoring template:
 *
 * 1. Copy the object below.
 * 2. Fill every field.
 * 3. Keep `publishedAt` in `YYYY.MM.DD`.
 * 4. Use `ctaLabel: "바로 써보기"` unless product rules change.
 * 5. Sort newest first.
 *
 * {
 *   id: "2026-03-18-dashboard-export",
 *   slug: "dashboard-export",
 *   title: "내 기록을 CSV로 내려받을 수 있어요",
 *   summary: "회고나 공유가 필요할 때, 기간과 선행지표를 골라 바로 저장할 수 있습니다.",
 *   publishedAt: "2026.03.18",
 *   tag: "Dashboard",
 *   ctaLabel: "바로 써보기",
 *   ctaHref: "/workspace/export",
 *   isMajor: true,
 * }
 */
export const productUpdates = [
  {
    id: "2026-07-17-team-nudge-poke",
    slug: "team-nudge-poke",
    title: "팀원을 가볍게 응원하는 콕 찌르기 기능이 추가되었어요",
    summary:
      "진행 상황을 잊었거나 미루고 있는 팀원에게 부담 없는 푸시 알림을 보내 가벼운 리마인드와 응원을 전해보세요.",
    publishedAt: "2026.07.17",
    tag: "Dashboard",
    ctaLabel: "바로 써보기",
    ctaHref: "/dashboard",
    isMajor: true,
  },
  {
    id: "2026-07-07-action-item-trend",
    slug: "action-item-trend",
    title: "액션 아이템의 전주 대비 증감을 한눈에 확인할 수 있어요",
    summary:
      "이번 주 액션 아이템이 지난주보다 얼마나 늘었거나 줄었는지 쉽게 파악할 수 있도록 대시보드에 증감 표시가 추가되었습니다.",
    publishedAt: "2026.07.07",
    tag: "Home",
    ctaLabel: "바로 써보기",
    ctaHref: "/dashboard/my",
    isMajor: true,
  },
  {
    id: "2026-06-29-workspace-past-week-edit",
    slug: "workspace-past-week-edit",
    title: "지난주 기록 수정 여부를 워크스페이스에서 설정할 수 있어요",
    summary:
      "팀의 운영 방식에 맞춰, 지난주 기록을 수정할 수 있는지 여부를 워크스페이스 설정에서 직접 관리할 수 있습니다.",
    publishedAt: "2026.06.29",
    tag: "Workspace",
    ctaLabel: "바로 써보기",
    ctaHref: "/workspace",
    isMajor: false,
  },
  {
    id: "2026-06-18-team-check-in",
    slug: "team-check-in",
    title: "팀원들의 상태를 확인하는 체크인 기능이 추가되었어요",
    summary:
      "팀원들과 함께 체크인을 진행하며 서로의 상태와 진행 상황을 더 쉽게 공유해보세요.",
    publishedAt: "2026.06.18",
    tag: "Dashboard",
    ctaLabel: "바로 써보기",
    ctaHref: "/dashboard",
    isMajor: true,
  },
  {
    id: "2026-06-13-dark-mode",
    slug: "dark-mode",
    title: "눈이 편안한 다크모드가 추가되었어요",
    summary:
      "어두운 환경에서도 편안하게 사용할 수 있도록 다크모드를 지원합니다. 시스템 설정에 맞춰 자동으로 적용됩니다.",
    publishedAt: "2026.06.13",
    tag: "Quality of Life",
    ctaLabel: "바로 써보기",
    ctaHref: "/profile",
    isMajor: true,
  },
  {
    id: "2026-04-14-personal-reminder-schedule",
    slug: "personal-reminder-schedule",
    title: "개인 기록 리마인드 시간을 직접 정할 수 있어요",
    summary:
      "프로필 알림 설정에서 내 생활 리듬에 맞는 시간으로 매일 기록 리마인드 푸시를 받을 수 있습니다.",
    publishedAt: "2026.04.14",
    tag: "Profile",
    ctaLabel: "바로 써보기",
    ctaHref: "/profile?coachmark=personal-reminder",
    isMajor: true,
  },
  /*
  {
    id: "2026-04-14-lead-measure-tags",
    slug: "lead-measure-tags",
    title: "선행지표를 태그로 더 체계적으로 정리할 수 있어요",
    summary:
      "설정 화면에서 태그를 만들고 선행지표에 붙여서, 내 대시보드에서도 행동 카테고리를 더 쉽게 구분할 수 있습니다.",
    publishedAt: "2026.04.14",
    tag: "Setup",
    ctaLabel: "바로 써보기",
    ctaHref: "/setup?coachmark=lead-measure-tags",
    isMajor: true,
  },
  */
  {
    id: "2026-03-25-team-dashboard-memos",
    slug: "team-dashboard-memos",
    title: "팀 대시보드에서 회의 메모를 바로 남길 수 있어요",
    summary:
      "핵심 목표 회의 중 나온 메모나 확인할 일을 팀원별 주간 점수판 옆에 바로 적어두고 이어서 확인할 수 있습니다.",
    publishedAt: "2026.03.25",
    tag: "Dashboard",
    ctaLabel: "바로 써보기",
    ctaHref: "/dashboard",
    isMajor: true,
  },
  {
    id: "2026-03-22-team-dashboard-me-highlight",
    slug: "team-dashboard-me-highlight",
    title: "팀 대시보드에서 내 카드를 더 빨리 찾을 수 있어요",
    summary:
      "팀원 목록에서 내 카드가 맨 위로 정렬되고, 카드 테두리와 '나' 배지로 한눈에 구분할 수 있습니다.",
    publishedAt: "2026.03.22",
    tag: "Dashboard",
    ctaLabel: "바로 써보기",
    ctaHref: "/dashboard",
    isMajor: true,
  },
  {
    id: "2026-03-18-dashboard-export",
    slug: "dashboard-export",
    title: "내 기록을 CSV로 내려받을 수 있어요",
    summary:
      "회고나 공유가 필요할 때, 기간과 선행지표를 골라 바로 저장할 수 있습니다.",
    publishedAt: "2026.03.18",
    tag: "Dashboard",
    ctaLabel: "바로 써보기",
    ctaHref: "/workspace/export",
    isMajor: true,
    plan: "STANDARD",
  },
  {
    id: "2026-03-16-dashboard-period-navigation",
    slug: "dashboard-period-navigation",
    title: "지난 주와 지난 달 기록도 더 쉽게 볼 수 있어요",
    summary:
      "주간과 월간 보기를 오가며 원하는 날짜 기준으로 흐름을 살펴볼 수 있습니다.",
    publishedAt: "2026.03.16",
    tag: "Home",
    ctaLabel: "바로 써보기",
    ctaHref: "/dashboard/my",
    isMajor: false,
  },
] satisfies ProductUpdate[];
