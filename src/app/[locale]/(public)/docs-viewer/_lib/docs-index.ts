import { cache } from "react";
import { promises as fs } from "fs";
import path from "path";

const DOCS_ROOT = path.join(process.cwd(), "docs");

export type DocsViewerSection =
  | "planning"
  | "design"
  | "dev"
  | "operations"
  | "reference";

export type DocsViewerTopic =
  | "all"
  | "onboarding-entry"
  | "dashboard-report"
  | "monetization-plan"
  | "operations-admin"
  | "notification-reminder"
  | "policy-legal"
  | "auth-workspace"
  | "platform-infra"
  | "other";

export type DocsViewerLens =
  | "all"
  | "focus"
  | "recent"
  | "connected"
  | "history";

export interface DocsViewerHeading {
  depth: 1 | 2 | 3;
  text: string;
  id: string;
}

export interface DocsViewerDoc {
  id: string;
  relativePath: string;
  fileName: string;
  section: DocsViewerSection;
  topic: Exclude<DocsViewerTopic, "all">;
  title: string;
  summary: string;
  dateLabel: string | null;
  timestamp: number | null;
  headings: DocsViewerHeading[];
  content: string;
  links: string[];
  inboundLinks: string[];
  outboundCount: number;
  inboundCount: number;
  relationCount: number;
  isFocus: boolean;
  isRecent: boolean;
  isConnected: boolean;
  isHistory: boolean;
}

export interface DocsViewerIndex {
  docs: DocsViewerDoc[];
  docsByPath: Map<string, DocsViewerDoc>;
}

type ParsedFrontmatter = {
  data: Record<string, string>;
  content: string;
};

const FRONTMATTER_BOUNDARY = "---";
const RECENT_DAYS = 14;
const HISTORY_DAYS = 45;

const TOPIC_PATTERNS: Array<{
  topic: Exclude<DocsViewerTopic, "all">;
  patterns: RegExp[];
}> = [
  {
    topic: "onboarding-entry",
    patterns: [/onboarding/i, /landing/i, /copy/i, /signup/i, /install/i],
  },
  {
    topic: "dashboard-report",
    patterns: [/dashboard/i, /report/i, /scoreboard/i],
  },
  {
    topic: "monetization-plan",
    patterns: [/billing/i, /pricing/i, /monetization/i, /plan value/i],
  },
  {
    topic: "operations-admin",
    patterns: [
      /admin/i,
      /operation/i,
      /incident/i,
      /restore/i,
      /deployment/i,
      /discord/i,
      /slack/i,
      /contact/i,
      /audit/i,
    ],
  },
  {
    topic: "notification-reminder",
    patterns: [/notification/i, /reminder/i, /push/i, /fcm/i],
  },
  {
    topic: "policy-legal",
    patterns: [/legal/i, /policy/i, /privacy/i, /terms/i],
  },
  {
    topic: "auth-workspace",
    patterns: [/auth/i, /workspace/i, /invite/i, /login/i],
  },
  {
    topic: "platform-infra",
    patterns: [/api/i, /schema/i, /database/i, /performance/i, /backend/i],
  },
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[`*_~]/g, "")
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function walkDocs(dirPath: string): Promise<string[]> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const paths = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        return walkDocs(fullPath);
      }

      if (entry.isFile() && entry.name.endsWith(".md")) {
        return [fullPath];
      }

      return [];
    }),
  );

  return paths.flat();
}

function parseFrontmatter(raw: string): ParsedFrontmatter {
  if (!raw.startsWith(`${FRONTMATTER_BOUNDARY}\n`)) {
    return { data: {}, content: raw };
  }

  const endIndex = raw.indexOf(`\n${FRONTMATTER_BOUNDARY}\n`, FRONTMATTER_BOUNDARY.length + 1);
  if (endIndex === -1) {
    return { data: {}, content: raw };
  }

  const frontmatterRaw = raw.slice(FRONTMATTER_BOUNDARY.length + 1, endIndex);
  const content = raw.slice(endIndex + FRONTMATTER_BOUNDARY.length + 2);
  const data: Record<string, string> = {};

  frontmatterRaw.split("\n").forEach((line) => {
    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) {
      return;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    if (!key || !value) {
      return;
    }

    data[key] = value.replace(/^["']|["']$/g, "");
  });

  return { data, content };
}

function getSection(relativePath: string): DocsViewerSection {
  const [topLevel, secondLevel] = relativePath.split("/");

  if (topLevel === "planning") {
    return "planning";
  }

  if (topLevel === "design") {
    return "design";
  }

  if (topLevel === "dev" && secondLevel === "operations") {
    return "operations";
  }

  if (topLevel === "dev") {
    return "dev";
  }

  return "reference";
}

function getTopic(relativePath: string, title: string): Exclude<DocsViewerTopic, "all"> {
  const haystack = `${relativePath} ${title}`.toLowerCase();

  for (const entry of TOPIC_PATTERNS) {
    if (entry.patterns.some((pattern) => pattern.test(haystack))) {
      return entry.topic;
    }
  }

  return "other";
}

function extractDateLabel(relativePath: string, frontmatter: Record<string, string>) {
  const dateMatch = relativePath.match(/(\d{4}\.\d{2}\.\d{2})/);
  if (dateMatch) {
    return dateMatch[1];
  }

  return frontmatter["작성일시"]?.slice(0, 10).replace(/-/g, ".") ?? null;
}

function dateLabelToTimestamp(dateLabel: string | null) {
  if (!dateLabel) {
    return null;
  }

  const normalized = dateLabel.replace(/\./g, "-");
  const timestamp = Date.parse(`${normalized}T00:00:00+09:00`);
  return Number.isNaN(timestamp) ? null : timestamp;
}

function extractTitle(relativePath: string, content: string) {
  const headingMatch = content.match(/^#\s+(.+)$/m);
  if (headingMatch) {
    return headingMatch[1].trim();
  }

  return relativePath.split("/").pop()?.replace(/\.md$/, "") ?? relativePath;
}

function extractSummary(content: string) {
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    if (
      line.startsWith("#") ||
      line.startsWith(">") ||
      line.startsWith("- ") ||
      /^\d+\.\s/.test(line) ||
      line.startsWith("```")
    ) {
      continue;
    }

    return line;
  }

  return "";
}

function extractHeadings(content: string): DocsViewerHeading[] {
  const seen = new Map<string, number>();

  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^#{1,4}\s+/.test(line))
    .map((line) => {
      const depth = line.match(/^#+/)?.[0].length as 1 | 2 | 3 | 4;
      const text = line.replace(/^#{1,4}\s+/, "").trim();
      const baseId = slugify(text) || "section";
      const count = seen.get(baseId) ?? 0;
      seen.set(baseId, count + 1);
      const id = count === 0 ? baseId : `${baseId}-${count + 1}`;

      return { depth, text, id };
    });
}

function normalizeLinkedDocPath(rawLink: string, currentRelativePath: string) {
  const sanitized = rawLink.split("#")[0];
  if (!sanitized.endsWith(".md")) {
    return null;
  }

  if (sanitized.startsWith("/docs/")) {
    return sanitized.replace(/^\/docs\//, "");
  }

  if (sanitized.startsWith("docs/")) {
    return sanitized.replace(/^docs\//, "");
  }

  if (sanitized.startsWith("./") || sanitized.startsWith("../")) {
    const currentDir = path.dirname(currentRelativePath);
    return path.normalize(path.join(currentDir, sanitized)).replace(/\\/g, "/");
  }

  return null;
}

function extractLinks(content: string, relativePath: string) {
  const results = new Set<string>();
  const markdownLinkPattern = /\[[^\]]+\]\(([^)]+\.md[^)]*)\)/g;
  const inlinePathPattern = /docs\/[A-Za-z0-9._/-]+\.md/g;

  for (const match of content.matchAll(markdownLinkPattern)) {
    const normalized = normalizeLinkedDocPath(match[1], relativePath);
    if (normalized) {
      results.add(normalized);
    }
  }

  for (const match of content.matchAll(inlinePathPattern)) {
    results.add(match[0].replace(/^docs\//, ""));
  }

  return [...results];
}

function matchesLens(doc: DocsViewerDoc, lens: DocsViewerLens) {
  switch (lens) {
    case "focus":
      return doc.isFocus;
    case "recent":
      return doc.isRecent;
    case "connected":
      return doc.isConnected;
    case "history":
      return doc.isHistory;
    default:
      return true;
  }
}

export function filterDocsByLens(docs: DocsViewerDoc[], lens: DocsViewerLens) {
  return docs.filter((doc) => matchesLens(doc, lens));
}

export function filterDocsByTopic(
  docs: DocsViewerDoc[],
  topic: DocsViewerTopic,
) {
  if (topic === "all") {
    return docs;
  }

  return docs.filter((doc) => doc.topic === topic);
}

export function filterDocsBySection(
  docs: DocsViewerDoc[],
  section: DocsViewerSection | "all",
) {
  if (section === "all") {
    return docs;
  }

  return docs.filter((doc) => doc.section === section);
}

export function filterDocsByQuery(docs: DocsViewerDoc[], query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return docs;
  }

  return docs.filter((doc) => {
    const headingText = doc.headings.map((heading) => heading.text).join(" ");
    return `${doc.title} ${doc.relativePath} ${doc.summary} ${headingText}`
      .toLowerCase()
      .includes(normalizedQuery);
  });
}

export const getDocsViewerIndex = cache(async (): Promise<DocsViewerIndex> => {
  const filePaths = await walkDocs(DOCS_ROOT);
  const now = Date.now();
  const recentCutoff = now - RECENT_DAYS * 24 * 60 * 60 * 1000;
  const historyCutoff = now - HISTORY_DAYS * 24 * 60 * 60 * 1000;

  const baseDocs = await Promise.all(
    filePaths.map(async (filePath) => {
      const raw = await fs.readFile(filePath, "utf8");
      const relativePath = path.relative(DOCS_ROOT, filePath).replace(/\\/g, "/");
      const parsed = parseFrontmatter(raw);
      const title = extractTitle(relativePath, parsed.content);
      const dateLabel = extractDateLabel(relativePath, parsed.data);
      const timestamp = dateLabelToTimestamp(dateLabel);

      return {
        id: relativePath,
        relativePath,
        fileName: path.basename(relativePath),
        section: getSection(relativePath),
        topic: getTopic(relativePath, title),
        title,
        summary: parsed.data["목적"] || parsed.data["summary"] || extractSummary(parsed.content),
        dateLabel,
        timestamp,
        headings: extractHeadings(parsed.content),
        content: parsed.content,
        links: extractLinks(parsed.content, relativePath),
      };
    }),
  );

  const focusSeeds = new Set(
    baseDocs
      .filter(
        (doc) =>
          doc.relativePath === "onboarding.md" ||
          doc.relativePath === "dev/README.md",
      )
      .flatMap((doc) => doc.links),
  );

  const inboundListMap = new Map<string, string[]>();
  for (const doc of baseDocs) {
    for (const link of doc.links) {
      if (!inboundListMap.has(link)) {
        inboundListMap.set(link, []);
      }
      inboundListMap.get(link)!.push(doc.relativePath);
    }
  }

  const docs = baseDocs
    .map((doc) => {
      const inboundLinks = inboundListMap.get(doc.relativePath) ?? [];
      const inboundCount = inboundLinks.length;
      const outboundCount = doc.links.length;
      const relationCount = inboundCount + outboundCount;
      const isFocus =
        doc.relativePath === "onboarding.md" ||
        doc.relativePath === "dev/README.md" ||
        focusSeeds.has(doc.relativePath) ||
        inboundCount >= 4;
      const isRecent = doc.timestamp !== null && doc.timestamp >= recentCutoff;
      const isConnected = relationCount >= 4;
      const isHistory =
        !isRecent && !isFocus && doc.timestamp !== null && doc.timestamp < historyCutoff;

      return {
        ...doc,
        inboundLinks,
        inboundCount,
        outboundCount,
        relationCount,
        isFocus,
        isRecent,
        isConnected,
        isHistory,
      };
    })
    .sort((a, b) => {
      const aScore = Number(a.isFocus) * 10 + Number(a.isRecent) * 5 + a.relationCount;
      const bScore = Number(b.isFocus) * 10 + Number(b.isRecent) * 5 + b.relationCount;

      if (aScore !== bScore) {
        return bScore - aScore;
      }

      if (a.timestamp && b.timestamp && a.timestamp !== b.timestamp) {
        return b.timestamp - a.timestamp;
      }

      return a.relativePath.localeCompare(b.relativePath);
    });

  return {
    docs,
    docsByPath: new Map(docs.map((doc) => [doc.relativePath, doc])),
  };
});
