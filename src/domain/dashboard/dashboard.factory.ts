import type { DowinDatabase } from "@/db";
import { DailyLogStorage } from "@/domain/daily-log/storage/daily-log.storage";
import { ScoreboardStorage } from "@/domain/scoreboard/storage/scoreboard.storage";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { DashboardService } from "./services/dashboard.service";
import { ActionItemMetadataStorage } from "./storage/action-item-metadata.storage";

export function createDashboardService(db: DowinDatabase): DashboardService {
  return new DashboardService(
    new WorkspaceStorage(db),
    new ScoreboardStorage(db),
    new DailyLogStorage(db),
    new ActionItemMetadataStorage(db),
  );
}
