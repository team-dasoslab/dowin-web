import { serverRuntimeConfig } from "@/config/server-runtime-config";
import { getDb } from "@/db";
import { sessions } from "@/db/schema";
import {
  SESSION_REISSUE_INTERVAL_MS,
  SESSION_TTL_MS,
  SESSION_TTL_SECONDS,
} from "@/domain/auth/constants";
import { and, eq, gt } from "drizzle-orm";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "dowin_sid";
export const SESSION_COOKIE_SECURE = !serverRuntimeConfig.isDevelopment;
type Db = ReturnType<typeof getDb>;
type AuthSession = Pick<
  typeof sessions.$inferSelect,
  "id" | "userId" | "expiresAt"
>;
type CookieStore = Awaited<ReturnType<typeof cookies>>;

export const getSession = async (db: Db): Promise<AuthSession | null> => {
  const sessionId = await getSessionIdFromCookies();
  if (!sessionId) return null;

  return findValidSession(db, sessionId);
};

export const getSessionWithRefresh = async (
  db: Db,
): Promise<AuthSession | null> => {
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
): Promise<AuthSession | null> =>
  (await db.query.sessions.findFirst({
    columns: {
      id: true,
      userId: true,
      expiresAt: true,
    },
    where: and(eq(sessions.id, sessionId), gt(sessions.expiresAt, new Date())),
  })) ?? null;

const reissueSession = async (
  db: Db,
  cookieStore: CookieStore,
  session: AuthSession,
): Promise<AuthSession> => {
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

async function getSessionIdFromCookies() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value;
}
