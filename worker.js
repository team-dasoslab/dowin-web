import { runDailyReminder } from "@/domain/notification/services/run-daily-reminder";
import openNextWorker, {
  BucketCachePurge,
  DOQueueHandler,
  DOShardedTagCache,
} from "./.open-next/worker.js";

const DAILY_REMINDER_CRON = "0 * * * *";

export default {
  fetch(request, env, ctx) {
    return openNextWorker.fetch(request, env, ctx);
  },
  async scheduled(controller, env, ctx) {
    if (controller.cron === DAILY_REMINDER_CRON) {
      ctx.waitUntil(runDailyReminder(env));
    }
  },
};

export { BucketCachePurge, DOQueueHandler, DOShardedTagCache };
