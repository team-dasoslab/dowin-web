import { getDb } from "@/db";

export type Db = ReturnType<typeof getDb>;
import { workspaces } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function generateWorkspacePrefix(db: Db, name: string): Promise<string> {
  let prefix = name.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  if (prefix.length >= 3) {
    prefix = prefix.substring(0, 3);
  }
  if (prefix.length < 3) {
    prefix = "DOW";
  }

  const isPrefixExists = async (p: string) => {
    const result = await db
      .select({ id: workspaces.id })
      .from(workspaces)
      .where(eq(workspaces.actionItemPrefix, p))
      .limit(1);
    return result.length > 0;
  };

  if (!(await isPrefixExists(prefix)) && prefix !== "DOW") {
    return prefix;
  }

  let uniquePrefix = prefix;
  let counter = 1;
  while ((await isPrefixExists(uniquePrefix)) && counter < 10) {
    uniquePrefix = `${prefix.substring(0, 2)}${counter}`;
    counter++;
  }

  if (!(await isPrefixExists(uniquePrefix))) {
    return uniquePrefix;
  }

  let fallbackCounter = 1;
  uniquePrefix = `D${String(fallbackCounter).padStart(2, "0")}`;
  while (await isPrefixExists(uniquePrefix)) {
    fallbackCounter++;
    uniquePrefix = `D${String(fallbackCounter).padStart(2, "0")}`;
  }

  return uniquePrefix;
}
