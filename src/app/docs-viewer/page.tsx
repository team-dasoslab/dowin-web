import {
  filterDocsByLens,
  filterDocsByQuery,
  filterDocsBySection,
  filterDocsByTopic,
  getDocsViewerIndex,
  type DocsViewerDoc,
  type DocsViewerHeading,
  type DocsViewerLens,
  type DocsViewerSection,
  type DocsViewerTopic,
} from "@/app/[locale]/(public)/docs-viewer/_lib/docs-index";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { serverRuntimeConfig } from "@/config/server-runtime-config";
import { resolveLocale, type Locale } from "@/i18n/detect-locale";
import { cn } from "@/lib/utils";
import enMessages from "@/messages/en.json";
import koMessages from "@/messages/ko.json";
import { Check, Link2 } from "lucide-react";
import { cookies, headers } from "next/headers";
import NextLink from "next/link";
import { notFound } from "next/navigation";
import { DocumentOutlineClient } from "./DocumentOutlineClient";

export const dynamic = "force-dynamic";

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

type ViewerSearchParams = {
  section?: string;
  topic?: string;
  lens?: string;
  q?: string;
  doc?: string;
  tab?: string;
};

type DocsViewerMessages = typeof koMessages.DocsViewer;
type Translate = (
  key: string,
  values?: Record<string, string | number>,
) => string;

type DocsTreeNode = {
  name: string;
  path: string;
  type: "directory" | "file";
  children?: DocsTreeNode[];
  doc?: DocsViewerDoc;
};

const DOCS_VIEWER_MESSAGES: Record<Locale, DocsViewerMessages> = {
  ko: koMessages.DocsViewer,
  en: enMessages.DocsViewer,
};

function createTranslate(messages: DocsViewerMessages): Translate {
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

function pickSection(value?: string): DocsViewerSection | "all" {
  return SECTION_IDS.includes(value as (typeof SECTION_IDS)[number])
    ? (value as DocsViewerSection | "all")
    : "planning";
}

function pickTopic(value?: string): DocsViewerTopic {
  return TOPIC_IDS.includes(value as (typeof TOPIC_IDS)[number])
    ? (value as DocsViewerTopic)
    : "all";
}

function pickLens(value?: string): DocsViewerLens {
  return LENS_IDS.includes(value as (typeof LENS_IDS)[number])
    ? (value as DocsViewerLens)
    : "all";
}

function buildHref(params: {
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

function getLensBadges(doc: DocsViewerDoc) {
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

function insertDocNode(root: DocsTreeNode[], doc: DocsViewerDoc) {
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

function buildDocsTree(docs: DocsViewerDoc[]) {
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

function hasSelectedDescendant(
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

function parseContentBlocks(content: string) {
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

export default async function DocsViewerPage({
  searchParams,
}: {
  searchParams: Promise<ViewerSearchParams>;
}) {
  if (!serverRuntimeConfig.isDevelopment) {
    return notFound();
  }

  const headerList = await headers();
  const cookieStore = await cookies();
  const locale = resolveLocale({
    customLocale: headerList.get("x-dowin-locale"),
    cookieLocale: cookieStore.get("NEXT_LOCALE")?.value,
    acceptLanguage: headerList.get("accept-language"),
  });
  const t = createTranslate(DOCS_VIEWER_MESSAGES[locale]);
  const params = await searchParams;
  const section = pickSection(params.section);
  const topic = pickTopic(params.topic);
  const lens = pickLens(params.lens);
  const query = params.q?.trim() ?? "";
  const tab =
    params.tab === "feed" ? "feed" : params.tab === "todos" ? "todos" : "doc";

  const { docs, docsByPath } = await getDocsViewerIndex();
  const sectionDocs = filterDocsBySection(docs, section);
  const topicDocs = filterDocsByTopic(sectionDocs, topic);
  const lensDocs = filterDocsByLens(topicDocs, lens);
  const filteredDocs = filterDocsByQuery(lensDocs, query);
  const selectedDoc =
    (params.doc ? docsByPath.get(params.doc) : null) ??
    filteredDocs[0] ??
    sectionDocs[0] ??
    docs[0] ??
    null;

  const docsTree = buildDocsTree(docs);

  const topicCounts = TOPIC_IDS.map((topicId) => ({
    id: topicId,
    count:
      topicId === "all"
        ? sectionDocs.length
        : sectionDocs.filter((doc) => doc.topic === topicId).length,
  }));

  const lensCounts = LENS_IDS.map((lensId) => ({
    id: lensId,
    count:
      lensId === "all"
        ? topicDocs.length
        : filterDocsByLens(topicDocs, lensId as DocsViewerLens).length,
  }));

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-6">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <Button
                asChild
                className="min-h-10 border border-zinc-200 bg-white px-4 text-sm font-bold text-zinc-700 transition-colors"
              >
                <NextLink href="/">
                  {locale === "ko" ? "← 앱으로 돌아가기" : "← Back to app"}
                </NextLink>
              </Button>
              <h1 className="text-xl font-black text-zinc-900 tracking-tight">
                Dowin Docs
              </h1>
              <Badge className="rounded-lg border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                Internal
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <Button
                asChild
                className="min-h-10 border border-zinc-200 bg-white px-4 text-sm font-bold text-zinc-700 transition-colors"
              >
                <NextLink href="/api-docs">{t("cta.apiDocs")}</NextLink>
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)_280px] items-start">
          <aside className="space-y-6 xl:sticky xl:top-6 xl:max-h-[calc(100vh-3rem)] xl:overflow-y-auto [&::-webkit-scrollbar]:hidden">
            <Card className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
              <SectionHeader title={t("tree.title")} />
              <div className="mt-4 max-h-[560px] overflow-y-auto pr-1">
                <DocsTree
                  nodes={docsTree}
                  section={section}
                  topic={topic}
                  lens={lens}
                  query={query}
                  selectedPath={selectedDoc?.relativePath ?? null}
                />
              </div>
            </Card>
          </aside>

          <section className="space-y-4 flex flex-col">
            <Card className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
              <details
                open={section !== "all" || topic !== "all" || lens !== "all"}
                className="group/filters mb-4 border-b border-zinc-100 pb-4"
              >
                <summary className="flex cursor-pointer items-center text-sm font-bold text-zinc-700 list-none [&::-webkit-details-marker]:hidden">
                  <span className="mr-2 text-[10px] transition-transform group-open/filters:rotate-90">
                    ▶
                  </span>
                  Filters{" "}
                  {section !== "all" || topic !== "all" || lens !== "all" ? (
                    <span className="ml-2 flex h-2 w-2 rounded-full bg-primary" />
                  ) : null}
                </summary>

                <div className="mt-4 grid gap-6 sm:grid-cols-3">
                  <div>
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                      Folder
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {SECTION_IDS.map((sectionId) => {
                        const active = sectionId === section;
                        return (
                          <Button
                            key={sectionId}
                            asChild
                            className={cn(
                              "min-h-8 px-3 text-xs font-medium transition-colors rounded-lg",
                              active
                                ? "bg-zinc-900 text-white"
                                : "border border-zinc-200 bg-zinc-50 text-zinc-600",
                            )}
                          >
                            <NextLink
                              href={buildHref({
                                section: sectionId,
                                topic: "all",
                                lens: "all",
                                q: query,
                                doc: selectedDoc?.relativePath,
                                tab: tab,
                              })}
                            >
                              {t(`sections.${sectionId}`)}
                            </NextLink>
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                      {t("sidebar.topicTitle")}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {topicCounts.map(({ id, count }) => {
                        const active = id === topic;
                        return (
                          <Button
                            key={id}
                            asChild
                            className={cn(
                              "min-h-8 px-3 text-xs font-medium transition-colors rounded-lg",
                              active
                                ? "bg-primary text-white"
                                : "border border-zinc-200 bg-zinc-50 text-zinc-600",
                            )}
                          >
                            <NextLink
                              href={buildHref({
                                section,
                                topic: id as DocsViewerTopic,
                                lens,
                                q: query,
                                doc: selectedDoc?.relativePath,
                                tab: tab,
                              })}
                            >
                              {t(`topics.${id}`)} ({count})
                            </NextLink>
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                      {t("sidebar.lensTitle")}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {lensCounts.map(({ id, count }) => {
                        const active = id === lens;
                        return (
                          <Button
                            key={id}
                            asChild
                            className={cn(
                              "min-h-8 px-3 text-xs font-medium transition-colors rounded-lg",
                              active
                                ? "bg-zinc-900 text-white"
                                : "border border-zinc-200 bg-zinc-50 text-zinc-600",
                            )}
                          >
                            <NextLink
                              href={buildHref({
                                section,
                                topic,
                                lens: id as DocsViewerLens,
                                q: query,
                                doc: selectedDoc?.relativePath,
                                tab: tab,
                              })}
                            >
                              <span>{t(`lenses.${id}`)}</span>
                              <span className="ml-1.5 font-mono text-[10px] text-zinc-400 opacity-70">
                                ({count})
                              </span>
                            </NextLink>
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </details>

              <form className="flex flex-col gap-3 sm:flex-row" method="get">
                <input type="hidden" name="section" value={section} />
                {topic !== "all" ? (
                  <input type="hidden" name="topic" value={topic} />
                ) : null}
                {lens !== "all" ? (
                  <input type="hidden" name="lens" value={lens} />
                ) : null}
                {selectedDoc ? (
                  <input
                    type="hidden"
                    name="doc"
                    value={selectedDoc.relativePath}
                  />
                ) : null}
                {tab === "feed" ? (
                  <input type="hidden" name="tab" value="feed" />
                ) : null}
                <Input
                  name="q"
                  defaultValue={query}
                  placeholder={t("searchPlaceholder")}
                  className="input-dowin min-h-11 flex-1 px-4 text-sm"
                />
                <Button
                  type="submit"
                  className="min-h-11 bg-primary px-4 text-sm font-semibold text-white transition-colors"
                >
                  {t("searchButton")}
                </Button>
              </form>
            </Card>

            <div className="sticky top-0 z-20 -mx-2 px-2 pt-6 -mt-4 pb-px flex items-center gap-2 border-b border-zinc-200 bg-zinc-50/90 backdrop-blur-md">
              <NextLink
                href={buildHref({
                  section,
                  topic,
                  lens,
                  q: query,
                  doc: selectedDoc?.relativePath,
                  tab: "doc",
                })}
                className={cn(
                  "px-4 py-2 text-sm font-bold transition-colors border-b-2",
                  tab === "doc"
                    ? "border-zinc-900 text-zinc-900"
                    : "border-transparent text-zinc-500",
                )}
              >
                Current Document
              </NextLink>
              <NextLink
                href={buildHref({
                  section,
                  topic,
                  lens,
                  q: query,
                  doc: selectedDoc?.relativePath,
                  tab: "feed",
                })}
                className={cn(
                  "px-4 py-2 text-sm font-bold transition-colors border-b-2",
                  tab === "feed"
                    ? "border-zinc-900 text-zinc-900"
                    : "border-transparent text-zinc-500",
                )}
              >
                Document Feed{" "}
                <span className="ml-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
                  {filteredDocs.length}
                </span>
              </NextLink>
              <NextLink
                href={buildHref({
                  section,
                  topic,
                  lens,
                  q: query,
                  doc: selectedDoc?.relativePath,
                  tab: "todos",
                })}
                className={cn(
                  "px-4 py-2 text-sm font-bold transition-colors border-b-2",
                  tab === "todos"
                    ? "border-zinc-900 text-zinc-900"
                    : "border-transparent text-zinc-500",
                )}
              >
                Open Todos{" "}
                <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                  {
                    filteredDocs.filter((d) => /[-*]\s+\[\s\]/.test(d.content))
                      .length
                  }
                </span>
              </NextLink>
            </div>

            {tab === "doc" ? (
              <div className="space-y-4">
                {selectedDoc ? (
                  <DocumentPanel
                    activeDoc={selectedDoc}
                    t={t}
                  />
                ) : (
                  <EmptyFeedCard message={t("empty")} />
                )}
              </div>
            ) : (
              <Card className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                <SectionHeader
                  title={t("feed.title")}
                  description={t("feed.description", {
                    count: filteredDocs.length,
                    section: t(`sections.${section}`),
                  })}
                />
                <div className="mt-4 space-y-3">
                  {filteredDocs.length > 0 ? (
                    filteredDocs.map((doc) => (
                      <DocumentCard
                        key={doc.relativePath}
                        doc={doc}
                        isSelected={
                          doc.relativePath === selectedDoc?.relativePath
                        }
                        lens={lens}
                        query={query}
                        section={section}
                        t={t}
                        topic={topic}
                      />
                    ))
                  ) : (
                    <EmptyFeedCard message={t("empty")} />
                  )}
                </div>
              </Card>
            )}
          </section>

          <aside className="space-y-6 xl:sticky xl:top-6 xl:max-h-[calc(100vh-3rem)] xl:overflow-y-auto [&::-webkit-scrollbar]:hidden">
            {selectedDoc && tab === "doc" ? (
              <DocumentOutlineCard headings={selectedDoc.headings} t={t} />
            ) : null}
          </aside>
        </div>
      </div>
    </main>
  );
}

function DocumentCard({
  doc,
  isSelected,
  section,
  topic,
  lens,
  query,
  t,
}: {
  doc: DocsViewerDoc;
  isSelected: boolean;
  section: DocsViewerSection | "all";
  topic: DocsViewerTopic;
  lens: DocsViewerLens;
  query: string;
  t: Translate;
}) {
  const lensBadges = getLensBadges(doc);

  return (
    <div
      className={cn(
        "group relative flex flex-col gap-3 rounded-xl border p-5 transition-colors",
        isSelected
          ? "border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900"
          : "border-zinc-200 bg-white",
      )}
    >
      <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
        <span>{t(`sections.${doc.section}`)}</span>
        <span className="text-zinc-300">|</span>
        <span className="text-zinc-700">{t(`topics.${doc.topic}`)}</span>
        {lensBadges.map((badge) => (
          <span
            key={badge}
            className="text-emerald-600 border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 rounded-md"
          >
            {t(`lenses.${badge}`)}
          </span>
        ))}
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <NextLink
            href={buildHref({
              section,
              topic,
              lens,
              q: query,
              doc: doc.relativePath,
              tab: "doc",
            })}
            className="text-lg font-black text-zinc-900"
          >
            {doc.title}
          </NextLink>
          <p className="text-sm text-zinc-600 leading-relaxed line-clamp-2">
            {doc.summary}
          </p>
        </div>

        <div className="shrink-0 flex flex-col items-end gap-2">
          {doc.relationCount > 0 ? (
            <details className="group/details relative">
              <summary className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-zinc-100 px-2 py-1 text-xs font-bold text-zinc-600 transition-colors list-none [&::-webkit-details-marker]:hidden">
                <Link2 className="h-3.5 w-3.5" />
                {doc.relationCount}
              </summary>
              <div className="absolute right-0 top-full z-10 mt-2 w-64 rounded-xl border border-zinc-200 bg-white p-3 shadow-lg">
                <div className="flex max-h-48 flex-col gap-3 overflow-y-auto pr-1">
                  {doc.links.length > 0 && (
                    <div>
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                        Outbound Links ({doc.links.length})
                      </p>
                      <div className="flex flex-col gap-1">
                        {doc.links.map((link) => (
                          <NextLink
                            key={link}
                            href={buildHref({
                              section,
                              topic,
                              lens,
                              q: query,
                              doc: link,
                              tab: "doc",
                            })}
                            className="truncate rounded px-2 py-1 text-[11px] font-medium text-zinc-700 transition-colors"
                            title={link}
                          >
                            {link}
                          </NextLink>
                        ))}
                      </div>
                    </div>
                  )}
                  {doc.inboundLinks.length > 0 && (
                    <div>
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                        Inbound Links ({doc.inboundLinks.length})
                      </p>
                      <div className="flex flex-col gap-1">
                        {doc.inboundLinks.map((link) => (
                          <NextLink
                            key={link}
                            href={buildHref({
                              section,
                              topic,
                              lens,
                              q: query,
                              doc: link,
                              tab: "doc",
                            })}
                            className="truncate rounded px-2 py-1 text-[11px] font-medium text-zinc-700 transition-colors"
                            title={link}
                          >
                            {link}
                          </NextLink>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </details>
          ) : (
            <div className="flex items-center justify-center gap-1.5 rounded-lg bg-zinc-50 px-2 py-1 text-xs font-bold text-zinc-400">
              <Link2 className="h-3.5 w-3.5" />0
            </div>
          )}
        </div>
      </div>

      <div className="mt-1 flex items-center justify-between text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <span className="font-mono bg-zinc-100 px-1.5 py-0.5 rounded text-[10px] text-zinc-500">
            {doc.relativePath}
          </span>
          <span>{doc.dateLabel ?? t("card.noDate")}</span>
        </div>
      </div>
    </div>
  );
}

function FormattedText({ text }: { text: string }) {
  const parts = text.split(
    /(`[^`]+`|\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|\[[xX ]\])/,
  );
  return (
    <>
      {parts.map((part, i) => {
        if (!part) return null;

        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code
              key={i}
              className="rounded-md border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 font-mono text-[13px] text-zinc-800 break-words"
            >
              {part.slice(1, -1)}
            </code>
          );
        }

        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="font-bold text-zinc-900">
              {part.slice(2, -2)}
            </strong>
          );
        }

        if (part.match(/^\[[xX]\]$/)) {
          return (
            <span
              key={i}
              className="inline-flex items-center justify-center w-4 h-4 mx-0.5 border border-primary bg-primary rounded-sm text-white align-text-bottom"
            >
              <Check className="w-3 h-3" strokeWidth={3} />
            </span>
          );
        }

        if (part === "[ ]") {
          return (
            <span
              key={i}
              className="inline-flex items-center justify-center w-4 h-4 mx-0.5 border border-zinc-300 rounded-sm bg-white align-text-bottom"
            />
          );
        }

        if (part.startsWith("[") && part.endsWith(")")) {
          const match = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
          if (match) {
            const [, linkText, url] = match;
            if (url.startsWith("/docs/") || url.startsWith("docs/")) {
              const docPath = url.replace(/^\/?docs\//, "");
              return (
                <NextLink
                  key={i}
                  href={`/docs-viewer?doc=${encodeURIComponent(docPath)}&tab=doc`}
                  className="font-semibold text-primary underline decoration-primary/30 underline-offset-4 transition-colors"
                >
                  {linkText}
                </NextLink>
              );
            }

            return (
              <a
                key={i}
                href={url}
                target={url.startsWith("http") ? "_blank" : undefined}
                rel={url.startsWith("http") ? "noreferrer" : undefined}
                className="font-semibold text-primary underline decoration-primary/30 underline-offset-4 transition-colors"
              >
                {linkText}
              </a>
            );
          }
        }

        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

function DocumentPanel({
  activeDoc,
  t,
}: {
  activeDoc: DocsViewerDoc;
  t: Translate;
}) {
  const blocks = parseContentBlocks(activeDoc.content);

  return (
    <Card className="rounded-xl border border-zinc-200 bg-white p-6 md:p-8 shadow-sm">
      <div className="mb-8 rounded-xl border border-zinc-200 bg-zinc-50 p-5 shadow-sm">
        <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
          {t("detail.title")}
        </p>
        <div className="space-y-3">
          <div className="flex items-center gap-4 text-sm">
            <span className="w-12 font-bold text-zinc-500">
              {t("detail.date")}
            </span>
            <span className="font-semibold text-zinc-900">
              {activeDoc.dateLabel ?? "-"}
            </span>
          </div>
          {activeDoc.summary && (
            <div className="flex items-start gap-4 text-sm">
              <span className="w-12 pt-0.5 font-bold text-zinc-500">목적</span>
              <span className="flex-1 font-medium leading-relaxed text-zinc-900">
                {activeDoc.summary}
              </span>
            </div>
          )}
          <div className="flex items-start gap-4 text-sm">
            <span className="w-12 pt-0.5 font-bold text-zinc-500">
              {t("detail.path")}
            </span>
            <span className="flex-1 break-all font-mono text-[13px] font-bold text-zinc-800 pt-0.5">
              {activeDoc.relativePath}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {blocks.map((block, index) => {
          if (block.type === "heading") {
            const HeadingTag =
              block.depth === 1
                ? "h2"
                : block.depth === 2
                  ? "h3"
                  : block.depth === 3
                    ? "h4"
                    : block.depth === 4
                      ? "h5"
                      : "h6";
            return (
              <HeadingTag
                key={`${block.id}-${index}`}
                id={block.id}
                className={cn(
                  "font-bold tracking-tight text-zinc-900 mt-8 mb-4",
                  block.depth === 1 && "text-2xl font-black mt-10",
                  block.depth === 2 && "text-xl",
                  block.depth === 3 && "text-lg mt-6",
                  block.depth === 4 && "text-base mt-4",
                  block.depth >= 5 && "text-[15px] mt-4 text-zinc-800",
                )}
              >
                {block.text}
              </HeadingTag>
            );
          }

          if (block.type === "divider") {
            return (
              <hr
                key={`divider-${index}`}
                className="my-10 border-t-2 border-zinc-100"
              />
            );
          }

          if (block.type === "paragraph") {
            return (
              <p
                key={`${block.text.slice(0, 20)}-${index}`}
                className="text-[15px] leading-relaxed text-zinc-700"
              >
                <FormattedText text={block.text} />
              </p>
            );
          }

          if (block.type === "quote") {
            return (
              <div
                key={`${block.text.slice(0, 20)}-${index}`}
                className="rounded-xl border-l-4 border-primary bg-zinc-50 px-5 py-4 text-[15px] leading-relaxed text-zinc-700 italic"
              >
                <FormattedText text={block.text} />
              </div>
            );
          }

          if (block.type === "code") {
            return (
              <pre
                key={`${block.text.slice(0, 20)}-${index}`}
                className="overflow-x-auto rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-4 text-[13.5px] leading-relaxed text-zinc-800 font-mono"
              >
                <code>{block.text}</code>
              </pre>
            );
          }

          if (block.type === "list") {
            let orderCount = 0;
            return (
              <div
                key={`list-${index}`}
                className="space-y-2 py-1 text-[15px] leading-relaxed text-zinc-700"
              >
                {block.items.map((item, idx) => {
                  if (item.ordered) {
                    orderCount += 1;
                  } else if (item.indent === 0) {
                    orderCount = 0;
                  }

                  return (
                    <div
                      key={idx}
                      className="flex items-start"
                      style={{ marginLeft: `${item.indent * 10}px` }}
                    >
                      <span className="w-7 pt-px shrink-0 text-zinc-400 font-medium select-none text-[14.5px]">
                        {item.ordered ? `${orderCount}.` : "•"}
                      </span>
                      <span className="flex-1">
                        <FormattedText text={item.text} />
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          }
        })}
      </div>
    </Card>
  );
}

function DocumentOutlineCard({
  headings,
  t,
}: {
  headings: DocsViewerHeading[];
  t: Translate;
}) {
  return (
    <DocumentOutlineClient
      headings={headings}
      title={t("outline.title")}
      emptyText={t("outline.empty")}
    />
  );
}

function EmptyFeedCard({ message }: { message: string }) {
  return (
    <div className="rounded-[20px] border border-dashed border-border bg-zinc-50/70 px-4 py-10 text-center text-sm text-text-muted">
      {message}
    </div>
  );
}

function DocsTree({
  nodes,
  section,
  topic,
  lens,
  query,
  selectedPath,
}: {
  nodes: DocsTreeNode[];
  section: DocsViewerSection | "all";
  topic: DocsViewerTopic;
  lens: DocsViewerLens;
  query: string;
  selectedPath: string | null;
}) {
  return (
    <div className="space-y-1">
      {nodes.map((node) => (
        <DocsTreeNodeItem
          key={node.path}
          node={node}
          depth={0}
          section={section}
          topic={topic}
          lens={lens}
          query={query}
          selectedPath={selectedPath}
        />
      ))}
    </div>
  );
}

function DocsTreeNodeItem({
  node,
  depth,
  section,
  topic,
  lens,
  query,
  selectedPath,
}: {
  node: DocsTreeNode;
  depth: number;
  section: DocsViewerSection | "all";
  topic: DocsViewerTopic;
  lens: DocsViewerLens;
  query: string;
  selectedPath: string | null;
}) {
  if (node.type === "file" && node.doc) {
    const isSelected = node.doc.relativePath === selectedPath;

    return (
      <Button
        asChild
        className={cn(
          "flex min-h-8 w-full justify-start rounded-lg px-3 text-left text-[13px] font-medium transition-colors",
          isSelected
            ? "bg-primary/10 text-primary font-bold"
            : "bg-transparent text-zinc-600",
        )}
        style={{ paddingLeft: `${depth * 14 + 12}px` }}
      >
        <NextLink
          href={buildHref({
            section,
            topic,
            lens,
            q: query,
            doc: node.doc.relativePath,
            tab: "doc",
          })}
        >
          <span className="truncate">{node.name.replace(/\.md$/, "")}</span>
        </NextLink>
      </Button>
    );
  }

  const isOpen = hasSelectedDescendant(node, selectedPath) || depth < 1;

  return (
    <details open={isOpen} className="group">
      <summary
        className="flex min-h-8 cursor-pointer list-none items-center rounded-lg px-3 text-[13px] font-medium text-zinc-700"
        style={{ paddingLeft: `${depth * 14 + 12}px` }}
      >
        <span className="mr-2 text-[11px] text-text-muted transition-transform group-open:rotate-90">
          ▶
        </span>
        <span className="truncate">{node.name}</span>
      </summary>
      <div className="mt-1 space-y-1">
        {node.children?.map((child) => (
          <DocsTreeNodeItem
            key={child.path}
            node={child}
            depth={depth + 1}
            section={section}
            topic={topic}
            lens={lens}
            query={query}
            selectedPath={selectedPath}
          />
        ))}
      </div>
    </details>
  );
}
