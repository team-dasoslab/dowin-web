import { cookies } from "next/headers";
import { eq, and, gt } from "drizzle-orm";
import { getDb } from "@/db";
import { sessions } from "@/db/schema";
import {
  SESSION_REISSUE_INTERVAL_MS,
  SESSION_TTL_MS,
  SESSION_TTL_SECONDS,
} from "@/domain/auth/constants";

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

  if (!session) {
    return null;
  }

  if (shouldReissueSession(session.expiresAt)) {
    const nextExpiresAt = new Date(Date.now() + SESSION_TTL_MS);

    await db
      .update(sessions)
      .set({
        expiresAt: nextExpiresAt,
      })
      .where(eq(sessions.id, session.id));

    if (typeof cookieStore.set === "function") {
      cookieStore.set(SESSION_COOKIE, session.id, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: SESSION_TTL_SECONDS,
      });
    }

    return {
      ...session,
      expiresAt: nextExpiresAt,
    };
  }

  return session;
};

const shouldReissueSession = (expiresAt: Date): boolean => {
  const remainingMs = expiresAt.getTime() - Date.now();
  const refreshThresholdMs = SESSION_TTL_MS - SESSION_REISSUE_INTERVAL_MS;

  return remainingMs <= refreshThresholdMs;
};
