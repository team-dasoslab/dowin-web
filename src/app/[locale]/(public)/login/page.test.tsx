import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

import { getDb } from "@/db";
import { getSession } from "@/lib/server/auth";
import { redirectToDefaultWorkspace } from "@/lib/server/workspace-redirect";

import LoginPage from "./page";

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: vi.fn(async () => ({
    env: {
      DB: {},
    },
  })),
}));

vi.mock("@/db", () => ({
  getDb: vi.fn(() => ({ db: true })),
}));

vi.mock("@/lib/server/auth", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/server/workspace-redirect", () => ({
  redirectToDefaultWorkspace: vi.fn(),
}));

vi.mock("@/app/_components/LoginPageClient", () => ({
  default: () => <div>Login client</div>,
}));

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders login client when there is no active session", async () => {
    vi.mocked(getSession).mockResolvedValue(null);

    const result = await LoginPage({
      params: Promise.resolve({ locale: "ko" }),
    });

    render(result);

    expect(getDb).toHaveBeenCalledWith({});
    expect(screen.getByText("Login client")).toBeInTheDocument();
    expect(redirectToDefaultWorkspace).not.toHaveBeenCalled();
  });

  it("redirects active sessions to the default workspace", async () => {
    vi.mocked(getSession).mockResolvedValue({
      userId: 7,
    } as Awaited<ReturnType<typeof getSession>>);

    await LoginPage({
      params: Promise.resolve({ locale: "ko" }),
    });

    expect(redirectToDefaultWorkspace).toHaveBeenCalledWith(7, "ko");
  });
});
