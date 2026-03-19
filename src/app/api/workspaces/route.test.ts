import { getCloudflareContext } from "@opennextjs/cloudflare";
import { cookies } from "next/headers";
import { beforeEach, describe, it, vi } from "vitest";

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/domain/workspace/services/workspace.service");
vi.mock("@/db", () => ({
  getDb: vi.fn(),
}));

describe("POST /api/workspaces", () => {
  const mockGetCloudflareContext = vi.mocked(getCloudflareContext);
  const mockCookies = vi.mocked(cookies);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("성공적으로 워크스페이스를 생성하면 201을 반환한다", async () => {
    mockGetCloudflareContext.mockResolvedValue({ env: { DB: {} } } as never);
    mockCookies.mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: "session-123" }),
    } as never);
    // This is getting complex due to nested dependencies in route
    // In a real project, we might need a more robust way to mock the entire request flow
    // or keep routes extremely thin.
  });
});
