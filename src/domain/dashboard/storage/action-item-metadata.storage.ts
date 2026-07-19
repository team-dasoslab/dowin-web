import { getDb } from "@/db";
import {
  actionItemPublicIds,
  githubPrLinks,
  workspaces,
} from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";

type Db = ReturnType<typeof getDb>;

export class ActionItemMetadataStorage {
  constructor(private db: Db) {}

  async findMetadataForLeadMeasures(
    workspaceId: number,
    leadMeasureIds: number[]
  ) {
    if (leadMeasureIds.length === 0) return [];

    const publicIds = await this.db
      .select({
        leadMeasureId: actionItemPublicIds.leadMeasureId,
        displaySequence: actionItemPublicIds.displaySequence,
        prefix: workspaces.actionItemPrefix,
      })
      .from(actionItemPublicIds)
      .innerJoin(workspaces, eq(actionItemPublicIds.workspaceId, workspaces.id))
      .where(
        and(
          eq(actionItemPublicIds.workspaceId, workspaceId),
          inArray(actionItemPublicIds.leadMeasureId, leadMeasureIds)
        )
      );

    const prLinks = await this.db
      .select({
        id: githubPrLinks.id,
        leadMeasureId: githubPrLinks.leadMeasureId,
        title: githubPrLinks.title,
        url: githubPrLinks.url,
        number: githubPrLinks.number,
        state: githubPrLinks.state,
      })
      .from(githubPrLinks)
      .where(
        and(
          eq(githubPrLinks.workspaceId, workspaceId),
          inArray(githubPrLinks.leadMeasureId, leadMeasureIds)
        )
      );

    const groupedLinks = new Map<number, typeof prLinks>();
    for (const link of prLinks) {
      if (!groupedLinks.has(link.leadMeasureId)) {
        groupedLinks.set(link.leadMeasureId, []);
      }
      groupedLinks.get(link.leadMeasureId)!.push(link);
    }

    return publicIds.map((pid) => ({
      leadMeasureId: pid.leadMeasureId,
      publicId: pid.prefix ? `#${pid.prefix}-${pid.displaySequence}` : null,
      prLinks: groupedLinks.get(pid.leadMeasureId) ?? [],
    }));
  }
}
