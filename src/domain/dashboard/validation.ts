import { z } from "zod";

export const dashboardTeamQuerySchema = z.object({
  weekStart: z.string().date().optional(),
});
