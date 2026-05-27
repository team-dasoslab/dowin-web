import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCloudflareContext = vi.fn();
const mockGetDb = vi.fn();
const mockFindUserWorkspace = vi.fn();
const mockRedirect = vi.fn();

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: mockGetCloudflareContext,
}));

vi.mock("@/db", () => ({
  getDb: mockGetDb,
}));

vi.mock("@/domain/workspace/storage/workspace.storage", () => ({
  WorkspaceStorage: vi.fn(function MockWorkspaceStorage() {
    return {
      findUserWorkspace: mockFindUserWorkspace,
    };
  }),
}));

vi.mock("@/i18n/routing", () => ({
  redirect: mockRedirect,
}));

describe("workspace redirect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCloudflareContext.mockResolvedValue({ env: { DB: {} } });
    mockGetDb.mockReturnValue({});
  });

  it("기본 워크스페이스 public uid를 반환한다", async () => {
    mockFindUserWorkspace.mockResolvedValue({
      id: 1,
      uid: "ws_public",
    });

    const { getDefaultWorkspacePublicId } = await import("./workspace-redirect");

    await expect(getDefaultWorkspacePublicId(10)).resolves.toBe("ws_public");
    expect(mockFindUserWorkspace).toHaveBeenCalledWith(10);
  });

  it("워크스페이스가 없으면 새 워크스페이스 화면으로 보낸다", async () => {
    mockFindUserWorkspace.mockResolvedValue(null);

    const { redirectToDefaultWorkspace } = await import("./workspace-redirect");
    await redirectToDefaultWorkspace(10, "ko");

    expect(mockRedirect).toHaveBeenCalledWith({ href: "/workspace/new", locale: "ko" });
  });

  it("기본 워크스페이스가 있으면 uid 기반 대시보드로 보낸다", async () => {
    mockFindUserWorkspace.mockResolvedValue({
      id: 1,
      uid: "ws_public",
    });

    const { redirectToDefaultWorkspace } = await import("./workspace-redirect");
    await redirectToDefaultWorkspace(10, "ko");

    expect(mockRedirect).toHaveBeenCalledWith({
      href: "/ws_public/dashboard/my",
      locale: "ko",
    });
  });

  it("기본 워크스페이스가 있으면 uid 기반 하위 경로로 보낸다", async () => {
    mockFindUserWorkspace.mockResolvedValue({
      id: 1,
      uid: "ws_public",
    });

    const { redirectToDefaultWorkspacePath } = await import("./workspace-redirect");
    await redirectToDefaultWorkspacePath(10, "ko", "/setup?mode=create");

    expect(mockRedirect).toHaveBeenCalledWith({
      href: "/ws_public/setup?mode=create",
      locale: "ko",
    });
  });

  it("워크스페이스 uid가 없으면 숫자 id로 fallback하지 않는다", async () => {
    mockFindUserWorkspace.mockResolvedValue({
      id: 1,
      uid: null,
    });

    const { redirectToDefaultWorkspace } = await import("./workspace-redirect");

    await expect(redirectToDefaultWorkspace(10, "ko")).rejects.toThrow(
      "WORKSPACE_UID_MISSING:1",
    );
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});
