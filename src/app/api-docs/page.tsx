import Link from "next/link";
import { notFound } from "next/navigation";
import { SwaggerDocsClient } from "./SwaggerDocsClient";

export default function ApiDocsPage() {
  if (process.env.NODE_ENV !== "development") {
    return notFound();
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(85,99,217,0.12),transparent_32%),linear-gradient(180deg,#f7f9fc_0%,#f5f7fb_100%)] px-3 py-3 sm:px-5 sm:py-5">
      <section className="mx-auto mb-4 flex max-w-[1400px] flex-wrap items-center justify-between gap-3 rounded-[20px] border border-[var(--color-border)] bg-white/92 px-5 py-4 backdrop-blur-[12px]">
        <div>
          <h1 className="m-0 text-[28px] leading-none font-semibold tracking-[-0.04em] text-[var(--color-text-primary)]">
            WIG API Docs
          </h1>
          <p className="mt-1.5 text-sm text-[var(--color-text-secondary)]">
            source: src/api-spec/openapi.yaml
          </p>
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <a
            className="inline-flex min-h-10 flex-1 items-center justify-center rounded-full border border-[var(--color-border)] bg-white px-3.5 text-sm font-semibold text-[var(--color-text-primary)] no-underline sm:flex-none"
            href="/api/openapi"
            target="_blank"
            rel="noreferrer"
          >
            Raw YAML
          </a>
          <Link
            className="inline-flex min-h-10 flex-1 items-center justify-center rounded-full bg-[var(--color-primary)] px-3.5 text-sm font-semibold text-white no-underline sm:flex-none"
            href="/"
          >
            Back To App
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-white/96 shadow-[0_16px_50px_rgba(17,24,39,0.08)]">
        <SwaggerDocsClient />
      </section>
    </main>
  );
}
