import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCloudflareContext = vi.fn();
const mockGetDb = vi.fn();
const mockGetSessionWithRefresh = vi.fn();
const mockFindUserWorkspace = vi.fn();
const mockFindMembership = vi.fn();
const mockGetTeamWeeklyReport = vi.fn();

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
  });

  it("세션이 없으면 401을 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue(null);

    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost/api/reports/team-weekly"),
    );

    expect(response.status).toBe(401);
    expect(mockGetTeamWeeklyReport).not.toHaveBeenCalled();
  });

  it("워크스페이스가 없으면 404를 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 1 });
    mockFindUserWorkspace.mockResolvedValue(null);

    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost/api/reports/team-weekly"),
    );

    expect(response.status).toBe(404);
    expect(mockGetTeamWeeklyReport).not.toHaveBeenCalled();
  });

  it("워크스페이스 ADMIN이 아니면 403을 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 1 });
    mockFindUserWorkspace.mockResolvedValue({ id: 7, name: "팀" });
    mockFindMembership.mockResolvedValue({
      workspaceId: 7,
      userId: 1,
      role: "MEMBER",
    });

    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost/api/reports/team-weekly"),
    );

    expect(response.status).toBe(403);
    expect(mockGetTeamWeeklyReport).not.toHaveBeenCalled();
  });

  it("query가 유효하지 않으면 422를 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 1 });

    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost/api/reports/team-weekly?weeks=99"),
    );

    expect(response.status).toBe(422);
    expect(mockFindUserWorkspace).not.toHaveBeenCalled();
    expect(mockGetTeamWeeklyReport).not.toHaveBeenCalled();
  });

  it("워크스페이스 ADMIN이면 주간 리포트를 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 1 });
    mockFindUserWorkspace.mockResolvedValue({ id: 7, name: "팀" });
    mockFindMembership.mockResolvedValue({
      workspaceId: 7,
      userId: 1,
      role: "ADMIN",
    });
    mockGetTeamWeeklyReport.mockResolvedValue({
      workspaceId: 7,
      workspaceName: "팀",
      weekStart: "2026-04-20",
      weekEnd: "2026-04-26",
      members: [],
      trends: [],
    });

    const { GET } = await import("./route");
    const response = await GET(
      new Request(
        "http://localhost/api/reports/team-weekly?weekStart=2026-04-20&weeks=5",
      ),
    );

    expect(response.status).toBe(200);
    expect(mockGetTeamWeeklyReport).toHaveBeenCalledWith(
      1,
      "2026-04-20",
      5,
    );
  });
});
