export const getFadeInTransform = (
  isVisible: boolean,
  direction: "up" | "down" | "left" | "right" | "none",
  distance: number,
) => {
  if (isVisible) return "translate3d(0, 0, 0)";
  switch (direction) {
    case "up":
      return `translate3d(0, ${distance}px, 0)`;
    case "down":
      return `translate3d(0, -${distance}px, 0)`;
    case "left":
      return `translate3d(${distance}px, 0, 0)`;
    case "right":
      return `translate3d(-${distance}px, 0, 0)`;
    default:
      return "translate3d(0, 0, 0)";
  }
};
