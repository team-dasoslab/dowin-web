export function getRateColor(v: number) {
  if (v >= 80) return "text-success";
  if (v >= 50) return "text-primary";
  return "text-text-primary";
}

export function getRateBgColor(v: number) {
  if (v >= 80) return "bg-success";
  if (v >= 50) return "bg-primary";
  if (v > 0) return "bg-zinc-800";
  return "bg-transparent";
}
