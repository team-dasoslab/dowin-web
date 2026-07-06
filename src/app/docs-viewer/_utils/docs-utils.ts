import {
  type DocsViewerDoc,
  type DocsViewerLens,
  type DocsViewerSection,
  type DocsViewerTopic,
} from "@/app/[locale]/(public)/docs-viewer/_lib/docs-index";
import koMessages from "@/messages/ko.json";

const SECTION_IDS = [
  "all",
  "planning",
  "design",
  "dev",
  "operations",
  "reference",
] as const;
const TOPIC_IDS = [
  "all",
  "onboarding-entry",
  "dashboard-report",
  "monetization-plan",
  "operations-admin",
  "notification-reminder",
  "policy-legal",
  "auth-workspace",
  "platform-infra",
  "other",
] as const;
const LENS_IDS = ["all", "focus", "recent", "connected", "history"] as const;

type DocsViewerMessages = typeof koMessages.DocsViewer;
export type Translate = (
  key: string,
  values?: Record<string, string | number>,
) => string;

export type DocsTreeNode = {
  name: string;
  path: string;
  type: "directory" | "file";
  children?: DocsTreeNode[];
  doc?: DocsViewerDoc;
};

export function createTranslate(messages: DocsViewerMessages): Translate {
  return (key, values) => {
    const resolved = key.split(".").reduce<unknown>((current, part) => {
      if (typeof current === "object" && current !== null && part in current) {
        return (current as Record<string, unknown>)[part];
      }

      return undefined;
    }, messages);

    if (typeof resolved !== "string") {
      return key;
    }

    if (!values) {
      return resolved;
    }

    return resolved.replace(/\{(\w+)\}/g, (_, token) => {
      return String(values[token] ?? "");
    });
  };
}

export function pickSection(value?: string): DocsViewerSection | "all" {
  return SECTION_IDS.includes(value as (typeof SECTION_IDS)[number])
    ? (value as DocsViewerSection | "all")
    : "planning";
}

export function pickTopic(value?: string): DocsViewerTopic {
  return TOPIC_IDS.includes(value as (typeof TOPIC_IDS)[number])
    ? (value as DocsViewerTopic)
    : "all";
}

export function pickLens(value?: string): DocsViewerLens {
  return LENS_IDS.includes(value as (typeof LENS_IDS)[number])
    ? (value as DocsViewerLens)
    : "all";
}

export function buildHref(params: {
  section: DocsViewerSection | "all";
  topic: DocsViewerTopic;
  lens: DocsViewerLens;
  q?: string;
  doc?: string | null;
  tab?: "doc" | "feed" | "todos";
}) {
  const searchParams = new URLSearchParams();
  searchParams.set("section", params.section);

  if (params.topic !== "all") {
    searchParams.set("topic", params.topic);
  }

  if (params.lens !== "all") {
    searchParams.set("lens", params.lens);
  }

  if (params.q?.trim()) {
    searchParams.set("q", params.q.trim());
  }

  if (params.doc) {
    searchParams.set("doc", params.doc);
  }

  if (params.tab) {
    searchParams.set("tab", params.tab);
  }

  const query = searchParams.toString();
  return query.length > 0 ? `/docs-viewer?${query}` : "/docs-viewer";
}

export function getLensBadges(doc: DocsViewerDoc) {
  const badges: DocsViewerLens[] = [];

  if (doc.isFocus) {
    badges.push("focus");
  }
  if (doc.isRecent) {
    badges.push("recent");
  }
  if (doc.isConnected) {
    badges.push("connected");
  }
  if (doc.isHistory) {
    badges.push("history");
  }

  return badges;
}

export function insertDocNode(root: DocsTreeNode[], doc: DocsViewerDoc) {
  const segments = doc.relativePath.split("/");
  let currentLevel = root;
  let currentPath = "";

  segments.forEach((segment, index) => {
    currentPath = currentPath ? `${currentPath}/${segment}` : segment;
    const isFile = index === segments.length - 1;
    let existing = currentLevel.find((node) => node.path === currentPath);

    if (!existing) {
      existing = {
        name: segment,
        path: currentPath,
        type: isFile ? "file" : "directory",
        children: isFile ? undefined : [],
        doc: isFile ? doc : undefined,
      };
      currentLevel.push(existing);
    }

    if (!isFile) {
      currentLevel = existing.children ?? [];
      existing.children = currentLevel;
    }
  });
}

export function buildDocsTree(docs: DocsViewerDoc[]) {
  const root: DocsTreeNode[] = [];

  docs.forEach((doc) => insertDocNode(root, doc));

  const sortNodes = (nodes: DocsTreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "directory" ? -1 : 1;
      }

      return a.name.localeCompare(b.name);
    });

    nodes.forEach((node) => {
      if (node.children) {
        sortNodes(node.children);
      }
    });
  };

  sortNodes(root);
  return root;
}

export function hasSelectedDescendant(
  node: DocsTreeNode,
  selectedPath: string | null,
): boolean {
  if (!selectedPath) {
    return false;
  }

  if (node.type === "file") {
    return node.path === selectedPath;
  }

  return (
    node.children?.some((child) =>
      hasSelectedDescendant(child, selectedPath),
    ) ?? false
  );
}

export function parseContentBlocks(content: string) {
  const lines = content.split("\n");
  const blocks: Array<
    | { type: "heading"; depth: number; text: string; id: string }
    | { type: "paragraph"; text: string }
    | {
        type: "list";
        items: { text: string; ordered: boolean; indent: number }[];
      }
    | { type: "quote"; text: string }
    | { type: "code"; text: string }
    | { type: "divider" }
  > = [];

  let index = 0;
  const headingIds = new Map<string, number>();

  while (index < lines.length) {
    const rawLine = lines[index];
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
      blocks.push({ type: "divider" });
      index += 1;
      continue;
    }

    if (trimmed.startsWith("```")) {
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }
      index += 1;
      blocks.push({ type: "code", text: codeLines.join("\n") });
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const depth = headingMatch[1].length;
      const text = headingMatch[2].trim();
      const baseId = text
        .toLowerCase()
        .replace(/[`*_~]/g, "")
        .replace(/[^a-z0-9가-힣\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
      const count = headingIds.get(baseId) ?? 0;
      headingIds.set(baseId, count + 1);
      const id = count === 0 ? baseId : `${baseId}-${count + 1}`;

      blocks.push({ type: "heading", depth, text, id });
      index += 1;
      continue;
    }

    if (trimmed.startsWith(">")) {
      const quoteLines: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith(">")) {
        quoteLines.push(lines[index].trim().replace(/^>\s?/, ""));
        index += 1;
      }
      blocks.push({ type: "quote", text: quoteLines.join(" ") });
      continue;
    }

    if (/^[-*]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed)) {
      const items: { text: string; ordered: boolean; indent: number }[] = [];

      while (index < lines.length) {
        const rawLine = lines[index];
        const current = rawLine.trim();

        if (!current) {
          const nextLine =
            index + 1 < lines.length ? lines[index + 1].trim() : "";
          if (/^[-*]\s+/.test(nextLine) || /^\d+\.\s+/.test(nextLine)) {
            index += 1;
            continue;
          }
          index += 1;
          break;
        }

        const indentMatch = rawLine.match(/^\s+/);
        const indent = indentMatch ? indentMatch[0].length : 0;

        if (/^\d+\.\s+/.test(current)) {
          items.push({
            text: current.replace(/^\d+\.\s+/, ""),
            ordered: true,
            indent,
          });
          index += 1;
          continue;
        }

        if (/^[-*]\s+/.test(current)) {
          items.push({
            text: current.replace(/^[-*]\s+/, ""),
            ordered: false,
            indent,
          });
          index += 1;
          continue;
        }

        break;
      }

      blocks.push({ type: "list", items });
      continue;
    }

    const paragraphLines = [trimmed];
    index += 1;
    while (index < lines.length) {
      const current = lines[index].trim();
      if (
        !current ||
        current.startsWith("#") ||
        current.startsWith(">") ||
        current.startsWith("```") ||
        current === "---" ||
        /^[-*]\s+/.test(current) ||
        /^\d+\.\s+/.test(current)
      ) {
        break;
      }

      paragraphLines.push(current);
      index += 1;
    }

    blocks.push({ type: "paragraph", text: paragraphLines.join(" ") });
  }

  return blocks;
}
