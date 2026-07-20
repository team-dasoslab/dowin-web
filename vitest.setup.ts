import "@testing-library/jest-dom";
import { vi } from "vitest";

vi.mock("next/headers", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/headers")>();
  return {
    ...actual,
    headers: vi.fn(async () => new Map()),
  };
});

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  })),
  usePathname: vi.fn(() => ""),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  useParams: vi.fn(() => ({ workspaceId: "test-workspace" })),
  redirect: vi.fn(),
  permanentRedirect: vi.fn(),
}));
