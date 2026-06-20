import { runDailyReminder } from "@/domain/notification/services/run-daily-reminder";
import { runTeamCheckin } from "@/domain/team-checkin/services/run-team-checkin";
import { runBillingRevocation } from "@/domain/billing/services/run-billing-revocation";
import openNextWorker, {
  BucketCachePurge,
  DOQueueHandler,
  DOShardedTagCache,
} from "./.open-next/worker.js";

const DAILY_REMINDER_CRON = "0 * * * *";

const worker = {
  fetch(request, env, ctx) {
    return openNextWorker.fetch(request, env, ctx);
  },
  async scheduled(controller, env, ctx) {
    if (
      controller.cron === DAILY_REMINDER_CRON ||
      controller.cron === "0 * * * *"
    ) {
      ctx.waitUntil(
        runDailyReminder(env)
          .then((res) =>
            console.log(
              "Daily reminder run successfully:",
              JSON.stringify(res),
            ),
          )
          .catch((err) => console.error("Daily reminder run failed:", err)),
      );
      ctx.waitUntil(
        runTeamCheckin(env)
          .then((res) =>
            console.log(
              "Team checkin run successfully:",
              JSON.stringify(res),
            ),
          )
          .catch((err) => console.error("Team checkin run failed:", err)),
      );

      const currentUTCHour = new Date().getUTCHours();
      if (currentUTCHour === 0 || currentUTCHour === 15) {
        ctx.waitUntil(
          runBillingRevocation(env)
            .then((res) =>
              console.log(
                "Billing revocation run successfully:",
                JSON.stringify(res),
              ),
            )
            .catch((err) => console.error("Billing revocation run failed:", err)),
        );
      }
    }
  },
};

export default worker;

export { BucketCachePurge, DOQueueHandler, DOShardedTagCache };
