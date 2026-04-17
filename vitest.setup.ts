import "@testing-library/jest-dom";
import { vi } from "vitest";

vi.mock("next/headers", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/headers")>();
  return {
    ...actual,
    headers: vi.fn(async () => new Map()),
  };
});
