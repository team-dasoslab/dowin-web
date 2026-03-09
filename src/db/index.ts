import * as schema from "@/db/schema";
import { drizzle } from "drizzle-orm/d1";

export function getDb(d1: D1Database) {
  return drizzle(d1, { schema });
}
