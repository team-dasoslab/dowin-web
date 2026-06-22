import {
  workspaceBillingState,
  workspaceTeamCheckinSettings,
  workspaces,
} from "@/db/schema";
import { TeamCheckinStorage } from "@/domain/team-checkin/storage/team-checkin.storage";
import { beforeEach, describe, expect, it, vi } from "vitest";

type MockDb = {
  select: ReturnType<typeof vi.fn>;
  from: ReturnType<typeof vi.fn>;
  innerJoin: ReturnType<typeof vi.fn>;
  where: ReturnType<typeof vi.fn>;
};

describe("TeamCheckinStorage", () => {
  const mockDb = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    where: vi.fn(),
  } satisfies MockDb;

  const storage = new TeamCheckinStorage(
    mockDb as unknown as ConstructorParameters<typeof TeamCheckinStorage>[0],
  );

  beforeEach(() => {
    vi.resetAllMocks();
    mockDb.select.mockReturnThis();
    mockDb.from.mockReturnThis();
    mockDb.innerJoin.mockReturnThis();
    mockDb.where.mockResolvedValue([]);
  });

  describe("findEnabledSettingsWithWorkspaces", () => {
    it("requires an active billing state before a workspace can be evaluated", async () => {
      await expect(storage.findEnabledSettingsWithWorkspaces()).resolves.toEqual(
        [],
      );

      expect(mockDb.from).toHaveBeenCalledWith(workspaceTeamCheckinSettings);
      expect(mockDb.innerJoin).toHaveBeenCalledWith(
        workspaces,
        expect.anything(),
      );
      expect(mockDb.innerJoin).toHaveBeenCalledWith(
        workspaceBillingState,
        expect.anything(),
      );
      expect(mockDb.where).toHaveBeenCalledWith(expect.anything());
    });
  });
});
