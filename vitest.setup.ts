import "@testing-library/jest-dom";
import { vi } from "vitest";

vi.mock("next/headers", async (importOriginal) => {
  const actual = (await importOriginal()) as any;
  return {
    ...actual,
    headers: vi.fn(async () => new Map()),
  };
});
