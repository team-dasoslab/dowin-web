import { runDailyReminder } from "@/domain/notification/services/run-daily-reminder";
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
    console.log(
      `Cron triggered: ${controller.cron}, Time: ${new Date().toISOString()}`,
    );
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
    }
  },
};

export default worker;

export { BucketCachePurge, DOQueueHandler, DOShardedTagCache };
