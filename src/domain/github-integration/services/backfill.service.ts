import { getDb } from "@/db";
import { actionItemPublicIds, leadMeasures, scoreboards, workspaces } from "@/db/schema";
import { eq, isNull, asc } from "drizzle-orm";

export async function runGithubIntegrationBackfill(env: CloudflareEnv) {
  const db = getDb(env.DB);
  
  // 1. Workspace Prefix Backfill
  const allWorkspaces = await db.select().from(workspaces);
  const usedPrefixes = new Set<string>();
  let fallbackCounter = 1;

  for (const ws of allWorkspaces) {
    if (ws.actionItemPrefix !== "DOW") {
      usedPrefixes.add(ws.actionItemPrefix);
    }
  }

  const updates = [];
  for (const ws of allWorkspaces) {
    if (ws.actionItemPrefix !== "DOW") continue; // Already set (or left as default DOW, but we want to recalculate if it's strictly the default. Actually, new workspaces get DOW by default until we change the creation logic. Let's recalculate all that have "DOW".)

    let prefix = ws.name.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    if (prefix.length >= 3) {
      prefix = prefix.substring(0, 3);
    }

    if (prefix.length < 3) {
      prefix = `DOW`;
    }

    // Handle collisions naively
    if (usedPrefixes.has(prefix) && prefix !== "DOW") {
      let uniquePrefix = prefix;
      let counter = 1;
      while (usedPrefixes.has(uniquePrefix) && counter < 10) {
        uniquePrefix = `${prefix.substring(0, 2)}${counter}`;
        counter++;
      }
      prefix = uniquePrefix;
    }

    // Fallback if still colliding or too short
    if (usedPrefixes.has(prefix) || prefix.length < 3) {
      let uniquePrefix = `D${String(fallbackCounter).padStart(2, "0")}`;
      while (usedPrefixes.has(uniquePrefix)) {
        fallbackCounter++;
        uniquePrefix = `D${String(fallbackCounter).padStart(2, "0")}`;
      }
      prefix = uniquePrefix;
      fallbackCounter++;
    }

    usedPrefixes.add(prefix);
    updates.push(db.update(workspaces).set({ actionItemPrefix: prefix }).where(eq(workspaces.id, ws.id)));
  }

  // Execute workspace updates
  if (updates.length > 0) {
    await db.batch(updates as unknown as Parameters<typeof db.batch>[0]);
  }

  // 2. Action Item Public ID Backfill
  const allLeadMeasures = await db
    .select({
      id: leadMeasures.id,
      workspaceId: scoreboards.workspaceId,
    })
    .from(leadMeasures)
    .innerJoin(scoreboards, eq(leadMeasures.scoreboardId, scoreboards.id))
    .leftJoin(actionItemPublicIds, eq(leadMeasures.id, actionItemPublicIds.leadMeasureId))
    .where(isNull(actionItemPublicIds.id))
    .orderBy(asc(leadMeasures.createdAt), asc(leadMeasures.id));

  // Group by workspace
  const byWorkspace: Record<number, typeof allLeadMeasures> = {};
  for (const lm of allLeadMeasures) {
    if (!byWorkspace[lm.workspaceId]) {
      byWorkspace[lm.workspaceId] = [];
    }
    byWorkspace[lm.workspaceId].push(lm);
  }

  const publicIdInserts = [];
  for (const [workspaceIdStr, lms] of Object.entries(byWorkspace)) {
    const workspaceId = parseInt(workspaceIdStr, 10);
    
    // Find current max displaySequence
    const maxSeqResult = await db
      .select({ displaySequence: actionItemPublicIds.displaySequence })
      .from(actionItemPublicIds)
      .where(eq(actionItemPublicIds.workspaceId, workspaceId))
      .orderBy(asc(actionItemPublicIds.displaySequence));
    
    let currentSeq = maxSeqResult.length > 0 ? maxSeqResult[maxSeqResult.length - 1].displaySequence : 0;

    for (const lm of lms) {
      currentSeq++;
      publicIdInserts.push({
        workspaceId,
        leadMeasureId: lm.id,
        displaySequence: currentSeq,
      });
    }
  }

  if (publicIdInserts.length > 0) {
    const batchStmts = publicIdInserts.map((val) => db.insert(actionItemPublicIds).values(val));
    const chunkSize = 50;
    for (let i = 0; i < batchStmts.length; i += chunkSize) {
      const chunk = batchStmts.slice(i, i + chunkSize);
      await db.batch(chunk as unknown as Parameters<typeof db.batch>[0]);
    }
  }

  return {
    workspacePrefixUpdated: updates.length,
    publicIdsCreated: publicIdInserts.length,
  };
}
