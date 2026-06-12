import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { getSession } from "@/lib/server/auth";
import { redirectToDefaultWorkspace } from "@/lib/server/workspace-redirect";

import AccountRecoveryPage from "./page";

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

vi.mock("@/app/_components/AccountRecoveryPageClient", () => ({
  default: () => <div>Account recovery client</div>,
}));

describe("AccountRecoveryPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders recovery client when there is no active session", async () => {
    vi.mocked(getSession).mockResolvedValue(null);

    const result = await AccountRecoveryPage({
      params: Promise.resolve({ locale: "ko" }),
    });

    render(result);

    expect(screen.getByText("Account recovery client")).toBeInTheDocument();
    expect(redirectToDefaultWorkspace).not.toHaveBeenCalled();
  });

  it("redirects active sessions to the default workspace", async () => {
    vi.mocked(getSession).mockResolvedValue({
      userId: 7,
    } as Awaited<ReturnType<typeof getSession>>);

    await AccountRecoveryPage({
      params: Promise.resolve({ locale: "ko" }),
    });

    expect(redirectToDefaultWorkspace).toHaveBeenCalledWith(7, "ko");
  });
});
