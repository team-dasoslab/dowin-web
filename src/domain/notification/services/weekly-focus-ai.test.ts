import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  breakWeeklyFocusTie,
  createWeeklyFocusAiConfig,
} from "@/domain/notification/services/weekly-focus-ai";

vi.mock("ai", () => ({
  generateObject: vi.fn(),
}));

vi.mock("@ai-sdk/google", () => ({
  createGoogleGenerativeAI: vi.fn(),
}));

const mockGenerateObject = vi.mocked(generateObject);
const mockCreateGoogleGenerativeAI = vi.mocked(createGoogleGenerativeAI);
const mockProvider = vi.fn();

describe("breakWeeklyFocusTie", () => {
  const candidates = [
    {
      id: 11,
      name: "매일 물 2L",
      description: null,
      achieved: 1,
      expected: 4,
      rate: 25,
    },
    {
      id: 12,
      name: "주 3회 운동",
      description: "cardio",
      achieved: 2,
      expected: 8,
      rate: 25,
    },
  ];
  const config = createWeeklyFocusAiConfig({ apiKey: "test-api-key" });

  beforeEach(() => {
    vi.clearAllMocks();
    mockProvider.mockReturnValue("mock-model");
    mockCreateGoogleGenerativeAI.mockReturnValue(mockProvider as never);
  });

  it("returns selected id when Gemini chooses a valid candidate", async () => {
    mockGenerateObject.mockResolvedValue({
      object: {
        selectedLeadMeasureId: 12,
      },
    } as never);

    await expect(
      breakWeeklyFocusTie({
        goalName: "이번 주는 흔들리지 않기",
        candidates,
      }, config),
    ).resolves.toBe(12);

    expect(mockCreateGoogleGenerativeAI).toHaveBeenCalledWith({
      apiKey: "test-api-key",
    });
    expect(mockProvider).toHaveBeenCalledWith("gemini-2.5-flash");
    expect(mockGenerateObject).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "mock-model",
      }),
    );
  });

  it("returns null when Gemini returns an id outside the candidate set", async () => {
    mockGenerateObject.mockResolvedValue({
      object: {
        selectedLeadMeasureId: 999,
      },
    } as never);

    await expect(
      breakWeeklyFocusTie({
        goalName: "이번 주는 흔들리지 않기",
        candidates,
      }, config),
    ).resolves.toBeNull();
  });

  it("returns null when generateObject throws", async () => {
    mockGenerateObject.mockRejectedValue(new Error("provider failure"));

    await expect(
      breakWeeklyFocusTie({
        goalName: "이번 주는 흔들리지 않기",
        candidates,
      }, config),
    ).resolves.toBeNull();
  });
});
