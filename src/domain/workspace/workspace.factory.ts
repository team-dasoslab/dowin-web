import type { DowinDatabase } from "@/db";
import { WorkspaceStorage } from "./storage/workspace.storage";

export function createWorkspaceStorage(db: DowinDatabase): WorkspaceStorage {
  return new WorkspaceStorage(db);
}
