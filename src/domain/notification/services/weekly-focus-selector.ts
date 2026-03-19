export type WeeklyFocusCandidate = {
  id: number;
  name: string;
  description?: string | null;
  rate: number;
  achieved: number;
  expected: number;
};

export function computeWeeklyExecutionRate(input: {
  achieved: number;
  expected: number;
}) {
  if (input.expected <= 0) {
    return 0;
  }

  return Number(((input.achieved / input.expected) * 100).toFixed(1));
}

export function chooseWeeklyFocusCandidate(candidates: WeeklyFocusCandidate[]) {
  if (candidates.length === 0) {
    return { kind: "none" } as const;
  }

  const lowestRate = Math.min(...candidates.map((candidate) => candidate.rate));
  const lowestCandidates = candidates.filter(
    (candidate) => candidate.rate === lowestRate,
  );

  if (lowestCandidates.length === 1) {
    return { kind: "direct", candidate: lowestCandidates[0] } as const;
  }

  return { kind: "tie", candidates: lowestCandidates } as const;
}
