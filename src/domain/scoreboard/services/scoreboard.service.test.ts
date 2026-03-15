import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ScoreboardService,
  ScoreboardStoragePort,
  WorkspaceLookupPort,
} from "@/domain/scoreboard/services/scoreboard.service";

describe("ScoreboardService", () => {
  const findActiveScoreboard = vi.fn();
  const createScoreboard = vi.fn();
  const findOwnedScoreboard = vi.fn();
  const updateScoreboard = vi.fn();
  const archiveScoreboard = vi.fn();
  const reactivateScoreboard = vi.fn();
  const findArchivedScoreboards = vi.fn();
  const findUserWorkspace = vi.fn();

  const mockScoreboardStorage: ScoreboardStoragePort = {
    findActiveScoreboard,
    createScoreboard,
    findOwnedScoreboard,
    updateScoreboard,
    archiveScoreboard,
    reactivateScoreboard,
    findArchivedScoreboards,
  };

  const mockWorkspaceStorage: WorkspaceLookupPort = {
    findUserWorkspace,
  };

  const service = new ScoreboardService(
    mockScoreboardStorage,
    mockWorkspaceStorage,
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getActiveScoreboard", () => {
    it("활성 점수판이 있으면 반환한다", async () => {
      findUserWorkspace.mockResolvedValue({ id: 3 });
      findActiveScoreboard.mockResolvedValue({
        id: 10,
        status: "ACTIVE",
      });

      const result = await service.getActiveScoreboard(1);

      expect(result).toEqual({ id: 10, status: "ACTIVE" });
      expect(mockScoreboardStorage.findActiveScoreboard).toHaveBeenCalledWith(
        1,
        3,
      );
    });

    it("활성 점수판이 없으면 404 에러를 던진다", async () => {
      findUserWorkspace.mockResolvedValue({ id: 3 });
      findActiveScoreboard.mockResolvedValue(null);

      await expect(service.getActiveScoreboard(1)).rejects.toThrow("NOT_FOUND");
    });
  });

  describe("createScoreboard", () => {
    it("활성 점수판이 없으면 새 점수판을 생성한다", async () => {
      const payload = {
        goalName: "체중을 감량한다",
        lagMeasure: "80kg에서 75kg까지 달성",
        startDate: "2026-03-15",
        endDate: "2026-06-30",
      };

      findUserWorkspace.mockResolvedValue({ id: 3 });
      findActiveScoreboard.mockResolvedValue(null);
      createScoreboard.mockResolvedValue({ id: 10 });

      const result = await service.createScoreboard(1, payload);

      expect(result).toEqual({ id: 10 });
      expect(createScoreboard).toHaveBeenCalledWith({
        ...payload,
        userId: 1,
        workspaceId: 3,
      });
    });

    it("이미 활성 점수판이 있으면 409 에러를 던진다", async () => {
      findUserWorkspace.mockResolvedValue({ id: 3 });
      findActiveScoreboard.mockResolvedValue({ id: 10 });

      await expect(
        service.createScoreboard(1, {
          goalName: "체중을 감량한다",
          lagMeasure: "80kg에서 75kg까지 달성",
          startDate: "2026-03-15",
          endDate: null,
        }),
      ).rejects.toThrow("ACTIVE_SCOREBOARD_EXISTS");
    });
  });

  describe("updateScoreboard", () => {
    it("ACTIVE 점수판은 수정할 수 있다", async () => {
      findUserWorkspace.mockResolvedValue({ id: 3 });
      findOwnedScoreboard.mockResolvedValue({
        id: 10,
        status: "ACTIVE",
      });
      updateScoreboard.mockResolvedValue({
        id: 10,
        goalName: "독서 습관을 만든다",
      });

      const result = await service.updateScoreboard(10, 1, {
        goalName: "독서 습관을 만든다",
      });

      expect(result).toEqual({
        id: 10,
        goalName: "독서 습관을 만든다",
      });
      expect(updateScoreboard).toHaveBeenCalledWith(10, {
        goalName: "독서 습관을 만든다",
      });
    });

    it("ARCHIVED 점수판 수정 시 403 에러를 던진다", async () => {
      findUserWorkspace.mockResolvedValue({ id: 3 });
      findOwnedScoreboard.mockResolvedValue({
        id: 10,
        status: "ARCHIVED",
      });

      await expect(
        service.updateScoreboard(10, 1, { goalName: "독서 습관을 만든다" }),
      ).rejects.toThrow("SCOREBOARD_ARCHIVED");
    });
  });

  describe("archiveScoreboard", () => {
    it("ACTIVE 점수판을 ARCHIVED로 변경한다", async () => {
      findUserWorkspace.mockResolvedValue({ id: 3 });
      findOwnedScoreboard.mockResolvedValue({
        id: 10,
        status: "ACTIVE",
      });
      archiveScoreboard.mockResolvedValue({
        id: 10,
        status: "ARCHIVED",
      });

      const result = await service.archiveScoreboard(10, 1);

      expect(result).toEqual({ id: 10, status: "ARCHIVED" });
      expect(archiveScoreboard).toHaveBeenCalledWith(
        10,
        expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      );
    });
  });

  describe("getHistory", () => {
    it("보관된 점수판 목록을 반환한다", async () => {
      findUserWorkspace.mockResolvedValue({ id: 3 });
      findArchivedScoreboards.mockResolvedValue([
        { id: 1, status: "ARCHIVED" },
      ]);

      const result = await service.getHistory(1);

      expect(result).toEqual([{ id: 1, status: "ARCHIVED" }]);
      expect(findArchivedScoreboards).toHaveBeenCalledWith(1, 3);
    });
  });

  describe("reactivateScoreboard", () => {
    it("다른 활성 점수판이 없으면 ARCHIVED 점수판을 ACTIVE로 변경한다", async () => {
      findUserWorkspace.mockResolvedValue({ id: 3 });
      findOwnedScoreboard.mockResolvedValue({
        id: 10,
        status: "ARCHIVED",
      });
      findActiveScoreboard.mockResolvedValue(null);
      reactivateScoreboard.mockResolvedValue({
        id: 10,
        status: "ACTIVE",
      });

      const result = await service.reactivateScoreboard(10, 1);

      expect(result).toEqual({ id: 10, status: "ACTIVE" });
      expect(findActiveScoreboard).toHaveBeenCalledWith(1, 3);
      expect(reactivateScoreboard).toHaveBeenCalledWith(10);
    });

    it("이미 ACTIVE 점수판이면 400 에러를 던진다", async () => {
      findUserWorkspace.mockResolvedValue({ id: 3 });
      findOwnedScoreboard.mockResolvedValue({
        id: 10,
        status: "ACTIVE",
      });

      await expect(service.reactivateScoreboard(10, 1)).rejects.toThrow(
        "SCOREBOARD_ALREADY_ACTIVE",
      );
    });

    it("다른 활성 점수판이 있으면 409 에러를 던진다", async () => {
      findUserWorkspace.mockResolvedValue({ id: 3 });
      findOwnedScoreboard.mockResolvedValue({
        id: 10,
        status: "ARCHIVED",
      });
      findActiveScoreboard.mockResolvedValue({
        id: 99,
        status: "ACTIVE",
      });

      await expect(service.reactivateScoreboard(10, 1)).rejects.toThrow(
        "ACTIVE_SCOREBOARD_EXISTS",
      );
    });
  });
});
