import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCloudflareContext = vi.fn();
const mockGetDb = vi.fn();
const mockGetSessionWithRefresh = vi.fn();
const mockFindUserWorkspace = vi.fn();
const mockFindMembership = vi.fn();
const mockGetAccessContextData = vi.fn();
const mockResolveIdByUid = vi.fn();
const mockGetTeamWeeklyReport = vi.fn();
// removed cookie mock

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: mockGetCloudflareContext,
}));

vi.mock("@/db", () => ({
  getDb: mockGetDb,
}));

vi.mock("@/lib/server/auth", () => ({
  getSessionWithRefresh: mockGetSessionWithRefresh,
}));

vi.mock("@/domain/workspace/storage/workspace.storage", () => ({
  WorkspaceStorage: vi.fn(function MockWorkspaceStorage() {
    return {
      findUserWorkspace: mockFindUserWorkspace,
      findMembership: mockFindMembership,
      getAccessContextData: mockGetAccessContextData,
      resolveIdByUid: mockResolveIdByUid,
    };
  }),
}));

vi.mock("@/domain/scoreboard/storage/scoreboard.storage", () => ({
  ScoreboardStorage: vi.fn(),
}));

vi.mock("@/domain/daily-log/storage/daily-log.storage", () => ({
  DailyLogStorage: vi.fn(),
}));

vi.mock("@/domain/dashboard/services/dashboard.service", () => ({
  DashboardService: vi.fn(function MockDashboardService() {
    return {
      getTeamWeeklyReport: mockGetTeamWeeklyReport,
    };
  }),
}));

describe("GET /api/reports/team-weekly", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockGetCloudflareContext.mockReturnValue({ env: { DB: {} } });
    mockGetDb.mockReturnValue({});
    mockResolveIdByUid.mockResolvedValue(7);
  });

  it("세션이 없으면 401을 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue(null);

    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost/api/workspaces/7/reports/team-weekly"),
      { params: Promise.resolve({ id: "7" }) }
    );

    expect(response.status).toBe(401);
    expect(mockGetTeamWeeklyReport).not.toHaveBeenCalled();
  });

  it("워크스페이스가 없으면 404를 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 1 });
    mockResolveIdByUid.mockResolvedValue(null);
    mockGetAccessContextData.mockResolvedValue(null);

    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost/api/workspaces/7/reports/team-weekly"),
      { params: Promise.resolve({ id: "7" }) }
    );

    expect(response.status).toBe(404);
    expect(mockGetTeamWeeklyReport).not.toHaveBeenCalled();
  });

  it("워크스페이스 ADMIN이 아니면 403을 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 1 });
    mockGetAccessContextData.mockResolvedValue({
      workspace: { id: 7, uid: "ws_7", name: "팀", planCode: "FREE" },
      member: { id: 100, workspaceId: 7, userId: 1, role: "MEMBER" },
      billingState: null,
    });

    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost/api/workspaces/7/reports/team-weekly"),
      { params: Promise.resolve({ id: "7" }) }
    );

    expect(response.status).toBe(403);
    expect(mockGetTeamWeeklyReport).not.toHaveBeenCalled();
  });

  it("query가 유효하지 않으면 422를 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 1 });

    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost/api/workspaces/7/reports/team-weekly?weeks=99"),
      { params: Promise.resolve({ id: "7" }) }
    );

    expect(response.status).toBe(422);
    expect(mockFindUserWorkspace).not.toHaveBeenCalled();
    expect(mockGetTeamWeeklyReport).not.toHaveBeenCalled();
  });

  it("워크스페이스 ADMIN이면 주간 리포트를 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 1 });
    mockGetAccessContextData.mockResolvedValue({
      workspace: { id: 7, uid: "ws_7", name: "팀", planCode: "FREE" },
      member: { id: 100, workspaceId: 7, userId: 1, role: "ADMIN" },
      billingState: null,
    });
    mockGetTeamWeeklyReport.mockResolvedValue({
      id: 7,
      workspaceName: "팀",
      weekStart: "2026-04-20",
      weekEnd: "2026-04-26",
      members: [],
      trends: [],
    });

    const { GET } = await import("./route");
    const response = await GET(
      new Request(
        "http://localhost/api/workspaces/7/reports/team-weekly?weekStart=2026-04-20&weeks=5",
      ),
      { params: Promise.resolve({ id: "7" }) }
    );

    expect(response.status).toBe(200);
    expect(mockGetTeamWeeklyReport).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 1, workspaceId: 7 }),
      "2026-04-20",
      5,
    );
  });
});
