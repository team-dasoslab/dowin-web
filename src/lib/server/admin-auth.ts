import { serverRuntimeConfig } from "@/config/server-runtime-config";
import { getDb } from "@/db";
import { adminSessions } from "@/db/schema";
import { and, eq, gt } from "drizzle-orm";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_SESSION_COOKIE = "dowin_admin_sid";
export const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 4;
export const ADMIN_SESSION_TTL_MS = ADMIN_SESSION_TTL_SECONDS * 1000;
export const ADMIN_SESSION_REISSUE_INTERVAL_SECONDS = 60 * 30;
export const ADMIN_SESSION_REISSUE_INTERVAL_MS =
  ADMIN_SESSION_REISSUE_INTERVAL_SECONDS * 1000;
export const ADMIN_SESSION_COOKIE_SECURE = !serverRuntimeConfig.isDevelopment;

type Db = ReturnType<typeof getDb>;
type AdminSession = Pick<
  typeof adminSessions.$inferSelect,
  "id" | "adminUserId" | "expiresAt"
>;
type CookieStore = Awaited<ReturnType<typeof cookies>>;

export const getAdminSession = async (
  db: Db,
): Promise<AdminSession | null> => {
  const sessionToken = await getAdminSessionTokenFromCookies();
  if (!sessionToken) return null;

  return findValidAdminSession(db, sessionToken);
};

export const getAdminSessionWithRefresh = async (
  db: Db,
): Promise<AdminSession | null> => {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!sessionToken) return null;

  const session = await findValidAdminSession(db, sessionToken);
  if (!session) return null;

  if (!shouldReissueAdminSession(session.expiresAt)) {
    return session;
  }

  return reissueAdminSession(db, cookieStore, sessionToken, session);
};

export const createAdminSession = async (
  db: Db,
  adminUserId: number,
  metadata?: {
    ipAddress?: string | null;
    userAgent?: string | null;
  },
) => {
  const sessionToken = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + ADMIN_SESSION_TTL_MS);

  await db.insert(adminSessions).values({
    id: randomBytes(16).toString("hex"),
    adminUserId,
    sessionTokenHash: hashAdminSessionToken(sessionToken),
    expiresAt,
    ipAddress: metadata?.ipAddress ?? null,
    userAgent: metadata?.userAgent ?? null,
  });

  return { sessionToken, expiresAt };
};

export const deleteAdminSession = async (db: Db, sessionToken: string) => {
  await db
    .delete(adminSessions)
    .where(eq(adminSessions.sessionTokenHash, hashAdminSessionToken(sessionToken)));
};

export async function setAdminSessionCookie(
  sessionToken: string,
  maxAge = ADMIN_SESSION_TTL_SECONDS,
) {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: ADMIN_SESSION_COOKIE_SECURE,
    sameSite: "strict",
    path: "/",
    maxAge,
  });
}

export async function clearAdminSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: ADMIN_SESSION_COOKIE_SECURE,
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}

export function hashAdminSessionToken(sessionToken: string) {
  return createHash("sha256").update(sessionToken).digest("hex");
}

const shouldReissueAdminSession = (expiresAt: Date): boolean => {
  const remainingMs = expiresAt.getTime() - Date.now();
  const refreshThresholdMs =
    ADMIN_SESSION_TTL_MS - ADMIN_SESSION_REISSUE_INTERVAL_MS;

  return remainingMs <= refreshThresholdMs;
};

const findValidAdminSession = async (
  db: Db,
  sessionToken: string,
): Promise<AdminSession | null> =>
  (await db.query.adminSessions.findFirst({
    columns: {
      id: true,
      adminUserId: true,
      expiresAt: true,
    },
    where: and(
      eq(adminSessions.sessionTokenHash, hashAdminSessionToken(sessionToken)),
      gt(adminSessions.expiresAt, new Date()),
    ),
  })) ?? null;

const reissueAdminSession = async (
  db: Db,
  cookieStore: CookieStore,
  sessionToken: string,
  session: AdminSession,
): Promise<AdminSession> => {
  const nextExpiresAt = new Date(Date.now() + ADMIN_SESSION_TTL_MS);

  await db
    .update(adminSessions)
    .set({
      expiresAt: nextExpiresAt,
      lastAccessedAt: new Date(),
    })
    .where(
      eq(adminSessions.sessionTokenHash, hashAdminSessionToken(sessionToken)),
    );

  cookieStore.set(ADMIN_SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: ADMIN_SESSION_COOKIE_SECURE,
    sameSite: "strict",
    path: "/",
    maxAge: ADMIN_SESSION_TTL_SECONDS,
  });

  return {
    ...session,
    expiresAt: nextExpiresAt,
  };
};

export async function getAdminSessionTokenFromCookies() {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
}
