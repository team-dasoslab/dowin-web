import {
  DailyDiscordReportService,
  type DailyDiscordReportInput,
} from "@/domain/analytics/services/daily-discord-report.service";
import { describe, expect, it, vi } from "vitest";

describe("DailyDiscordReportService", () => {
  const service = new DailyDiscordReportService();

  const input: DailyDiscordReportInput = {
    reportDate: "2026-04-18",
    timezone: "Asia/Seoul",
    acquisition: {
      signUps: 8,
      workspaceActivatedUsers: 6,
      scoreboardCreatedUsers: 5,
      firstLogUsers: 3,
      activationRateFromSignup: 75,
      firstLogRateFromScoreboard: 60,
    },
    engagement: {
      activeUsers: 14,
      loggingUsers: 9,
      streakCandidateUsers: 4,
    },
    retention: {
      returningUsers7d: 7,
      retainedUsers14d: 5,
    },
    intervention: {
      pushClicks: 11,
      pushFollowupConversions24h: 4,
      leaderReportClicks: null,
      leaderReminderConversions24h: null,
    },
    alerts: ["점수판 생성 대비 첫 기록 전환이 3일 연속 하락했습니다."],
    notes: [
      "설정 완료 직후 첫 기록 CTA를 강화한 실험 영향인지 확인",
      "푸시 클릭 이후 랜딩 화면 이탈 여부 확인",
    ],
  };

  it("Discord 전송용 payload를 운영 리포트 형식으로 만든다", () => {
    const payload = service.buildPayload(input);

    expect(payload.content).toBe(
      "WIG Daily Report · 2026-04-18 (Asia/Seoul)",
    );
    expect(payload.embeds).toHaveLength(1);
    expect(payload.embeds[0].fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Activation",
          value: expect.stringContaining("가입 8"),
        }),
        expect.objectContaining({
          name: "Alerts",
          value: expect.stringContaining("첫 기록 전환이 3일 연속 하락"),
        }),
        expect.objectContaining({
          name: "Next Check",
          value: expect.stringContaining("CTA를 강화한 실험 영향"),
        }),
      ]),
    );
  });

  it("Discord 웹훅으로 payload를 전송한다", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
    });

    await service.send({
      webhookUrl: "https://discord.example.com/webhook",
      input,
      fetchImpl: fetchImpl as never,
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://discord.example.com/webhook",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );
  });

  it("Discord 웹훅 호출이 실패하면 에러를 던진다", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: vi.fn().mockResolvedValue("bad request"),
    });

    await expect(
      service.send({
        webhookUrl: "https://discord.example.com/webhook",
        input,
        fetchImpl: fetchImpl as never,
      }),
    ).rejects.toThrow("DISCORD_WEBHOOK_FAILED: 400 bad request");
  });
});
