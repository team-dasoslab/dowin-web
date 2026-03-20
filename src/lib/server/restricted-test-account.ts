import { getDb } from "@/db";
import { users } from "@/db/schema";
import { apiError } from "@/lib/server/api-response";
import { eq } from "drizzle-orm";

export type RestrictedWriteIntent =
  | "general-write"
  | "daily-log-upsert"
  | "profile-avatar-update";

type RuntimeEnv = {
  NEXTJS_ENV?: string;
};

type GuardParams = {
  db: ReturnType<typeof getDb>;
  userId: number;
  env?: RuntimeEnv;
  intent: RestrictedWriteIntent;
};

const RESTRICTED_TEST_ACCOUNT_CUSTOM_IDS = new Set(["test2", "test3", "test4"]);

const isProductionRuntime = (env?: RuntimeEnv) =>
  (env?.NEXTJS_ENV ?? process.env.NODE_ENV) === "production";

const isRestrictedTestAccount = async (
  db: ReturnType<typeof getDb>,
  userId: number,
) => {
  const user = await db.query.users.findFirst({
    columns: {
      customId: true,
    },
    where: eq(users.id, userId),
  });

  return user != null && RESTRICTED_TEST_ACCOUNT_CUSTOM_IDS.has(user.customId);
};

export async function guardRestrictedTestAccountWrite({
  db,
  userId,
  env,
  intent,
}: GuardParams) {
  if (!isProductionRuntime(env)) {
    return null;
  }

  if (!(await isRestrictedTestAccount(db, userId))) {
    return null;
  }

  if (intent === "daily-log-upsert" || intent === "profile-avatar-update") {
    return null;
  }

  return restrictedTestAccountForbiddenResponse();
}

export const restrictedTestAccountForbiddenResponse = () =>
  apiError("TEST_ACCOUNT_WRITE_RESTRICTED");
