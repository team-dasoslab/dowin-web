import { Footer } from "@/app/_components/Footer";
import { DowinIcon } from "@/components/ui/DowinIcon";
import { LandingHeader } from "@/app/_components/LandingHeader";

type LegalDocumentSection = {
  heading: string;
  body: string[];
};

interface LegalDocumentPageProps {
  title: string;
  subtitle: string;
  effectiveDateLabel: string;
  effectiveDate: string;
  sections: LegalDocumentSection[];
  footnote: string;
}

export function LegalDocumentPage({
  title,
  subtitle,
  effectiveDateLabel,
  effectiveDate,
  sections,
  footnote,
}: LegalDocumentPageProps) {
  return (
    <main className="relative min-h-screen overflow-y-auto bg-zinc-50/50 px-4 pb-12 pt-28 selection:bg-primary/20 md:pb-20 md:pt-36">
      {/* Background Grid Pattern */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-dowin-grid-pattern bg-[size:32px_32px]" />

      {/* Background Glows */}
      <div className="pointer-events-none absolute left-0 top-0 -z-10 h-[600px] w-full overflow-hidden opacity-40">
        <div className="absolute -left-20 top-[-100px] h-[400px] w-[400px] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute right-[-80px] top-[100px] h-[350px] w-[350px] rounded-full bg-accent/15 blur-[100px]" />
      </div>

      <LandingHeader />

      <div className="mx-auto flex w-full max-w-[800px] flex-col gap-8 animate-dowin-in">
        {/* Header */}
        <header className="flex flex-col gap-6">
          <div className="flex items-center justify-end">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-primary/5 px-3.5 py-1.5 text-[11px] font-black tracking-wider text-primary/80">
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              {effectiveDateLabel} {effectiveDate}
            </div>
          </div>

          <div className="space-y-4 px-1">
            <h1 className="text-[32px] font-black leading-[1.1] tracking-tighter text-text-primary md:text-[48px]">
              {title}
            </h1>
            <p className="max-w-2xl whitespace-pre-line text-[15px] font-medium leading-relaxed tracking-tight text-text-secondary break-keep md:text-[16px]">
              {subtitle}
            </p>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex flex-col gap-4">
          {sections.map((section, index) => (
            <section
              key={section.heading}
              className="relative overflow-hidden rounded-content border border-border bg-white p-6 md:p-8"
            >
              {/* Subtle Section Number Background */}
              <div className="absolute -right-4 -top-4 select-none opacity-[0.03]">
                <span className="text-[120px] font-black leading-none tracking-tighter">
                  {(index + 1).toString().padStart(2, "0")}
                </span>
              </div>

              <div className="relative flex items-start">
                <div className="min-w-0 flex-1 space-y-4">
                  <h2 className="text-[18px] font-black tracking-tight text-text-primary md:text-[20px]">
                    {section.heading}
                  </h2>
                  <div className="space-y-4">
                    {section.body.map((paragraph, pIdx) => (
                      <p
                        key={pIdx}
                        className="text-[15px] leading-7 tracking-tight text-text-secondary break-keep md:text-[16px]"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          ))}

          {/* Footnote */}
          <footer className="mt-4 rounded-content border border-dashed border-border bg-sub-background/50 px-6 py-6 text-[13px] font-medium leading-relaxed text-text-muted md:px-8">
            <div className="flex items-start gap-3">
              <DowinIcon
                name="status-info"
                size="16px"
                className="mt-0.5 shrink-0 opacity-50"
              />
              <p className="break-keep">{footnote}</p>
            </div>
          </footer>
        </div>

        <Footer />
      </div>
    </main>
  );
}
