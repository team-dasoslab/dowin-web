import { describe, expect, it } from "vitest";
import {
  chooseWeeklyFocusCandidate,
  computeWeeklyExecutionRate,
  type WeeklyFocusCandidate,
} from "@/domain/notification/services/weekly-focus-selector";

describe("weekly-focus-selector", () => {
  it("computeWeeklyExecutionRate returns 0 when expected count is 0", () => {
    expect(computeWeeklyExecutionRate({ achieved: 3, expected: 0 })).toBe(0);
  });

  it("computeWeeklyExecutionRate returns a rounded percentage for active progress", () => {
    expect(computeWeeklyExecutionRate({ achieved: 2, expected: 3 })).toBe(66.7);
  });

  it('chooseWeeklyFocusCandidate([]) returns { kind: "none" }', () => {
    expect(chooseWeeklyFocusCandidate([])).toEqual({ kind: "none" });
  });

  it('chooseWeeklyFocusCandidate returns { kind: "direct", candidate } for one lowest-rate measure', () => {
    const candidate: WeeklyFocusCandidate = {
      id: 1,
      name: "매일 물 2L",
      description: null,
      rate: 25,
      achieved: 1,
      expected: 4,
    };

    expect(
      chooseWeeklyFocusCandidate([
        candidate,
        {
          id: 2,
          name: "주 3회 운동",
          description: "cardio",
          rate: 50,
          achieved: 3,
          expected: 6,
        },
      ]),
    ).toEqual({ kind: "direct", candidate });
  });

  it('chooseWeeklyFocusCandidate returns { kind: "tie", candidates } for tied lowest-rate measures', () => {
    const candidates: WeeklyFocusCandidate[] = [
      {
        id: 1,
        name: "매일 물 2L",
        description: null,
        rate: 25,
        achieved: 1,
        expected: 4,
      },
      {
        id: 2,
        name: "주 3회 운동",
        description: "cardio",
        rate: 25,
        achieved: 2,
        expected: 8,
      },
      {
        id: 3,
        name: "독서",
        description: "reading",
        rate: 50,
        achieved: 2,
        expected: 4,
      },
    ];

    expect(chooseWeeklyFocusCandidate(candidates)).toEqual({
      kind: "tie",
      candidates: candidates.slice(0, 2),
    });
  });
});
