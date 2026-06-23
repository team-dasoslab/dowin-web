import { runBillingRevocation } from "@/domain/billing/services/run-billing-revocation";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  batch: vi.fn(),
};

vi.mock("@/db", () => ({
  getDb: () => mockDb,
}));

describe("runBillingRevocation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.where.mockResolvedValue([]); // Default to empty
  });

  it("만료된 워크스페이스가 없으면 아무 일도 하지 않고 0을 반환한다", async () => {
    mockDb.where.mockResolvedValue([]);

    const result = await runBillingRevocation({} as CloudflareEnv);

    expect(result).toEqual({ expiredCount: 0 });
    expect(mockDb.batch).not.toHaveBeenCalled();
  });

  it("과거에 만료된 워크스페이스의 권한을 강등하고 일괄 처리(batch)를 호출한다", async () => {
    mockDb.where.mockResolvedValue([
      { workspaceId: 101 },
      { workspaceId: 202 },
    ]);

    const result = await runBillingRevocation({} as CloudflareEnv);

    expect(result).toEqual({ expiredCount: 2 });
    
    // update를 4번(workspace 2개 * 테이블 2개) 호출했는지 확인
    expect(mockDb.update).toHaveBeenCalledTimes(4);
    expect(mockDb.set).toHaveBeenCalledWith({
      billingStatus: "EXPIRED",
      planCode: "FREE",
    });
    expect(mockDb.set).toHaveBeenCalledWith({ planCode: "FREE" });
    
    // batch가 한 번 호출되었는지 확인
    expect(mockDb.batch).toHaveBeenCalledTimes(1);
    
    // batch() 인자 검증 - 배열이 전달되어야 함
    const batchArgs = mockDb.batch.mock.calls[0][0];
    expect(batchArgs).toBeInstanceOf(Array);
    expect(batchArgs).toHaveLength(4);
  });
});
