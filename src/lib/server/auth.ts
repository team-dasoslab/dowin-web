import { cookies } from "next/headers";
import { eq, and, gt } from "drizzle-orm";
import { getDb } from "@/db";
import { sessions } from "@/db/schema";
import {
  SESSION_REISSUE_INTERVAL_MS,
  SESSION_TTL_MS,
  SESSION_TTL_SECONDS,
} from "@/domain/auth/constants";
import { serverRuntimeConfig } from "@/config/server-runtime-config";

export const SESSION_COOKIE = "wig_sid";
export const SESSION_COOKIE_SECURE = !serverRuntimeConfig.isDevelopment;
type Db = ReturnType<typeof getDb>;
type Session = typeof sessions.$inferSelect;
type CookieStore = Awaited<ReturnType<typeof cookies>>;

export const getSession = async (db: Db): Promise<Session | null> => {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  return findValidSession(db, sessionId);
};

export const getSessionWithRefresh = async (db: Db): Promise<Session | null> => {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  const session = await findValidSession(db, sessionId);

  if (!session) {
    return null;
  }

  if (!shouldReissueSession(session.expiresAt)) {
    return session;
  }

  return reissueSession(db, cookieStore, session);
};

const shouldReissueSession = (expiresAt: Date): boolean => {
  const remainingMs = expiresAt.getTime() - Date.now();
  const refreshThresholdMs = SESSION_TTL_MS - SESSION_REISSUE_INTERVAL_MS;

  return remainingMs <= refreshThresholdMs;
};

const findValidSession = async (
  db: Db,
  sessionId: string,
): Promise<Session | null> =>
  (await db.query.sessions.findFirst({
    where: and(
      eq(sessions.id, sessionId),
      gt(sessions.expiresAt, new Date()),
    ),
  })) ?? null;

const reissueSession = async (
  db: Db,
  cookieStore: CookieStore,
  session: Session,
): Promise<Session> => {
  const nextExpiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await db
    .update(sessions)
    .set({
      expiresAt: nextExpiresAt,
    })
    .where(eq(sessions.id, session.id));

  cookieStore.set(SESSION_COOKIE, session.id, {
    httpOnly: true,
    secure: SESSION_COOKIE_SECURE,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });

  return {
    ...session,
    expiresAt: nextExpiresAt,
  };
};
