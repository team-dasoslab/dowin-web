import { getDb } from "@/db";
import { workspaceBillingState, workspaces } from "@/db/schema";
import { and, eq, inArray, lt } from "drizzle-orm";

export const runBillingRevocation = async (env: CloudflareEnv) => {
  const db = getDb(env.DB);

  const expiredStates = await db
    .select()
    .from(workspaceBillingState)
    .where(
      and(
        eq(workspaceBillingState.billingStatus, "ACTIVE"),
        inArray(workspaceBillingState.entitlementSource, [
          "BETA_PROMOTIONAL_GRANT",
          "MANUAL_GRANT",
        ]),
        lt(workspaceBillingState.currentPeriodEnd, new Date()),
      ),
    );

  if (expiredStates.length === 0) {
    return { expiredCount: 0 };
  }

  const batchStmts = [];
  for (const state of expiredStates) {
    batchStmts.push(
      db
        .update(workspaceBillingState)
        .set({ billingStatus: "EXPIRED" })
        .where(eq(workspaceBillingState.workspaceId, state.workspaceId)),
    );

    batchStmts.push(
      db
        .update(workspaces)
        .set({ planCode: "FREE" })
        .where(eq(workspaces.id, state.workspaceId)),
    );
  }

  // @ts-expect-error - db.batch is supported by Drizzle D1 dialect but types might differ slightly
  await db.batch(batchStmts);

  return { expiredCount: expiredStates.length };
};
