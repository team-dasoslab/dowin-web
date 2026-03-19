import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

const weeklyFocusChoiceSchema = z.object({
  selectedLeadMeasureId: z.number().int(),
});

export type WeeklyFocusTieBreakInput = {
  goalName: string;
  candidates: Array<{
    id: number;
    name: string;
    description?: string | null;
    achieved: number;
    expected: number;
    rate: number;
  }>;
};

export type WeeklyFocusAiConfig = Readonly<{
  apiKey: string;
  model: "gemini-2.5-flash";
}>;

export function createWeeklyFocusAiConfig(input: {
  apiKey: string;
  model?: WeeklyFocusAiConfig["model"];
}): WeeklyFocusAiConfig {
  return Object.freeze({
    apiKey: input.apiKey,
    model: input.model ?? "gemini-2.5-flash",
  });
}

export async function breakWeeklyFocusTie(
  input: WeeklyFocusTieBreakInput,
  config: WeeklyFocusAiConfig,
) {
  try {
    const google = createGoogleGenerativeAI({
      apiKey: config.apiKey,
    });

    const { object } = await generateObject({
      model: google(config.model),
      schema: weeklyFocusChoiceSchema,
      prompt: [
        `WIG goal: ${input.goalName}`,
        "Choose exactly one lead measure id that should be nudged first this week.",
        "Only choose from the candidates below.",
        JSON.stringify(input.candidates),
      ].join("\n\n"),
    });

    return input.candidates.some(
      (candidate) => candidate.id === object.selectedLeadMeasureId,
    )
      ? object.selectedLeadMeasureId
      : null;
  } catch {
    return null;
  }
}
