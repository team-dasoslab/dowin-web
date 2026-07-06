export const getSwitchTranslateClass = (
  isChecked: boolean,
  sizeType: "default" | "sm" | "lg" | null | undefined,
) => {
  if (!isChecked) return "translate-x-0";
  switch (sizeType) {
    case "sm":
      return "translate-x-3";
    case "lg":
      return "translate-x-5";
    case "default":
    default:
      return "translate-x-[20px]";
  }
};
