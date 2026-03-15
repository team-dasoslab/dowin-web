import { cookies } from "next/headers";
import { eq, and, gt } from "drizzle-orm";
import { getDb } from "@/db";
import { sessions } from "@/db/schema";

export const SESSION_COOKIE = "wig_sid";
type Db = ReturnType<typeof getDb>;
type Session = typeof sessions.$inferSelect;

export const getSession = async (db: Db): Promise<Session | null> => {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  // Drizzle을 사용한 세션 조회 (만료 시간 체크 포함)
  const session = await db.query.sessions.findFirst({
    where: and(
      eq(sessions.id, sessionId),
      gt(sessions.expiresAt, new Date()),
    ),
  });

  return session ?? null;
};
