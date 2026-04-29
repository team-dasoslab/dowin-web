import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { sendFcmMessages } from "@/domain/notification/services/fcm";

describe("sendFcmMessages", () => {
  const mockFetch = vi.fn();
  const mockImportKey = vi.fn();
  const mockSign = vi.fn();
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", mockFetch);
    vi.stubGlobal("crypto", {
      subtle: {
        importKey: mockImportKey,
        sign: mockSign,
      },
    });
    mockImportKey.mockResolvedValue("private-key");
    mockSign.mockResolvedValue(new Uint8Array([1, 2, 3]).buffer);
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  it("성공/무효 토큰/일반 실패를 구분 집계한다", async () => {
    mockFetch
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            access_token: "access-token",
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: {
              details: [
                {
                  errorCode: "UNREGISTERED",
                },
              ],
            },
          }),
          { status: 400 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: {
              status: "INTERNAL",
            },
          }),
          { status: 500 },
        ),
      );

    const result = await sendFcmMessages(
      [
        {
          token: "token-1",
          title: "a",
          body: "b",
          url: "/ko/dashboard/my",
          pushType: "daily_reminder",
          campaignId: "campaign-1",
        },
        {
          token: "token-2",
          title: "a",
          body: "b",
          url: "/ko/dashboard/my",
          pushType: "daily_reminder",
          campaignId: "campaign-1",
        },
        {
          token: "token-3",
          title: "a",
          body: "b",
          url: "/ko/dashboard/my",
          pushType: "daily_reminder",
          campaignId: "campaign-1",
        },
      ],
      {
        projectId: "project-id",
        clientEmail: "service@example.com",
        privateKey: "-----BEGIN PRIVATE KEY-----\\nAQAB\\n-----END PRIVATE KEY-----",
      },
    );

    expect(result).toEqual({
      success: 1,
      failed: 1,
      disabledTokens: ["token-2"],
    });
    expect(mockFetch).toHaveBeenCalledTimes(4);
    expect(mockImportKey).toHaveBeenCalled();
    expect(mockSign).toHaveBeenCalled();
  });
});
