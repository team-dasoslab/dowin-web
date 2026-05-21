import { serverRuntimeConfig } from "@/config/server-runtime-config";
import { cookies } from "next/headers";

const MISSING_REQUEST_SCOPE_MESSAGE = "outside a request scope";

export const ACTIVE_WORKSPACE_COOKIE = "dowin_workspace";
const ACTIVE_WORKSPACE_COOKIE_SECURE = !serverRuntimeConfig.isDevelopment;

export const getActiveWorkspaceIdFromCookies = async (): Promise<
  number | null
> => {
  const cookieStore = await safeCookies();
  const rawValue = cookieStore?.get(ACTIVE_WORKSPACE_COOKIE)?.value;

  if (!rawValue) {
    return null;
  }

  const workspaceId = Number(rawValue);
  return Number.isInteger(workspaceId) && workspaceId > 0 ? workspaceId : null;
};

export const setActiveWorkspaceCookie = async (workspaceId: number) => {
  const cookieStore = await safeCookies();
  if (!cookieStore) {
    return;
  }

  cookieStore.set(ACTIVE_WORKSPACE_COOKIE, String(workspaceId), {
    httpOnly: true,
    secure: ACTIVE_WORKSPACE_COOKIE_SECURE,
    sameSite: "lax",
    path: "/",
  });
};

export const clearActiveWorkspaceCookie = async () => {
  const cookieStore = await safeCookies();
  if (!cookieStore) {
    return;
  }

  cookieStore.delete(ACTIVE_WORKSPACE_COOKIE);
};

async function safeCookies() {
  try {
    return await cookies();
  } catch (error) {
    if (isMissingRequestScopeError(error)) {
      return null;
    }

    throw error;
  }
}

function isMissingRequestScopeError(error: unknown) {
  return (
    error instanceof Error &&
    error.message.includes(MISSING_REQUEST_SCOPE_MESSAGE)
  );
}
