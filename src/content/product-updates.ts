export const PRODUCT_UPDATE_TAGS = [
  "Dashboard",
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
 *   ctaHref: "/profile/export",
 *   isMajor: true,
 * }
 */
export const productUpdates = [
  {
    id: "2026-03-18-dashboard-export",
    slug: "dashboard-export",
    title: "내 기록을 CSV로 내려받을 수 있어요",
    summary:
      "회고나 공유가 필요할 때, 기간과 선행지표를 골라 바로 저장할 수 있습니다.",
    publishedAt: "2026.03.18",
    tag: "Dashboard",
    ctaLabel: "바로 써보기",
    ctaHref: "/profile/export",
    isMajor: true,
  },
  {
    id: "2026-03-18-profile-avatar",
    slug: "profile-avatar",
    title: "프로필 아이콘을 직접 고를 수 있어요",
    summary:
      "준비된 아바타 중 하나를 선택해 팀 대시보드에서 더 쉽게 구분할 수 있습니다.",
    publishedAt: "2026.03.18",
    tag: "Profile",
    ctaLabel: "바로 써보기",
    ctaHref: "/profile/avatar",
    isMajor: true,
  },
  {
    id: "2026-03-16-dashboard-period-navigation",
    slug: "dashboard-period-navigation",
    title: "지난 주와 지난 달 기록도 더 쉽게 볼 수 있어요",
    summary:
      "주간과 월간 보기를 오가며 원하는 날짜 기준으로 흐름을 살펴볼 수 있습니다.",
    publishedAt: "2026.03.16",
    tag: "Dashboard",
    ctaLabel: "바로 써보기",
    ctaHref: "/dashboard/my",
    isMajor: false,
  },
] satisfies ProductUpdate[];
