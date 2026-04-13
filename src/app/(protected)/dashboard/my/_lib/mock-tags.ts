export function getMockLeadMeasureTags(name?: string | null): string[] {
  const normalizedName = (name ?? "").trim().toLowerCase();

  if (!normalizedName) {
    return [];
  }

  const tags = new Set<string>();

  if (
    normalizedName.includes("운동") ||
    normalizedName.includes("달리기") ||
    normalizedName.includes("러닝")
  ) {
    tags.add("운동");
    tags.add("건강");
  }

  if (
    normalizedName.includes("집중") ||
    normalizedName.includes("딥워크") ||
    normalizedName.includes("몰입")
  ) {
    tags.add("집중");
    tags.add("루틴");
  }

  if (
    normalizedName.includes("회고") ||
    normalizedName.includes("리뷰") ||
    normalizedName.includes("복기")
  ) {
    tags.add("회고");
  }

  if (
    normalizedName.includes("독서") ||
    normalizedName.includes("책")
  ) {
    tags.add("독서");
    tags.add("집중");
  }

  if (tags.size === 0) {
    tags.add("루틴");
  }

  return Array.from(tags).slice(0, 3);
}
