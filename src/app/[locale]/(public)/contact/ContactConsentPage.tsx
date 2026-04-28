"use client";

import { Footer } from "@/components/layout/Footer";
import { LandingHeader } from "@/components/layout/LandingHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DowinIcon } from "@/components/ui/DowinIcon";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useState } from "react";

const TALLY_CONTACT_URL = "https://tally.so/r/2ExbKb";
const SUPPORT_EMAIL = "dowin.support@dasoslab.com";

export function ContactConsentPage({
  isAuthenticated = false,
}: {
  isAuthenticated?: boolean;
}) {
  const t = useTranslations("ContactPage");
  const [hasPrivacyConsent, setHasPrivacyConsent] = useState(false);
  const [hasOverseasConsent, setHasOverseasConsent] = useState(false);
  const isReady = hasPrivacyConsent && hasOverseasConsent;

  return (
    <main
      className={`relative min-h-screen overflow-y-auto bg-zinc-50/50 px-4 pb-12 selection:bg-primary/20 md:pb-20 ${
        isAuthenticated ? "pt-10 md:pt-14" : "pt-28 md:pt-36"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 -z-10 bg-dowin-grid-pattern bg-[size:32px_32px]" />

      <div className="pointer-events-none absolute left-0 top-0 -z-10 h-[600px] w-full overflow-hidden opacity-40">
        <div className="absolute -left-20 top-[-100px] h-[400px] w-[400px] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute right-[-80px] top-[100px] h-[350px] w-[350px] rounded-full bg-accent/15 blur-[100px]" />
      </div>

      {!isAuthenticated ? <LandingHeader /> : null}

      <div className="mx-auto flex w-full max-w-[820px] flex-col gap-8 animate-dowin-in">
        <header className="space-y-5 px-1">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-primary/5 px-3.5 py-1.5 text-[11px] font-black tracking-wider text-primary/80">
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            {t("badge")}
          </div>
          <div className="space-y-4">
            <h1 className="text-[32px] font-black leading-[1.1] tracking-tighter text-text-primary md:text-[48px]">
              {t("title")}
            </h1>
            <p className="max-w-2xl whitespace-pre-line text-[15px] font-medium leading-relaxed tracking-tight text-text-secondary break-keep md:text-[16px]">
              {t("description")}
            </p>
          </div>
        </header>

        <Card className="rounded-content border border-border bg-white p-6 md:p-8">
          <div className="space-y-6">
            <section className="space-y-3">
              <h2 className="text-[20px] font-black tracking-tight text-text-primary">
                {t("noticeTitle")}
              </h2>
              <div className="space-y-3 text-[15px] leading-7 tracking-tight text-text-secondary break-keep">
                <p>{t("noticeBody1")}</p>
                <p>{t("noticeBody2")}</p>
                <p className="font-bold text-danger">{t("noticeWarning")}</p>
              </div>
            </section>

            <section className="space-y-4">
              <label className="flex items-start gap-3 rounded-content border border-zinc-200 bg-zinc-50/70 p-4">
                <input
                  type="checkbox"
                  checked={hasPrivacyConsent}
                  onChange={(event) => {
                    setHasPrivacyConsent(event.target.checked);
                  }}
                  className="mt-1 h-4 w-4 rounded border-zinc-300 text-primary focus:ring-primary"
                />
                <div className="space-y-2">
                  <p className="text-[15px] font-bold tracking-tight text-text-primary">
                    {t("privacyConsentTitle")}
                  </p>
                  <p className="text-[14px] leading-6 text-text-secondary whitespace-pre-line">
                    {t("privacyConsentBody")}
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 rounded-content border border-zinc-200 bg-zinc-50/70 p-4">
                <input
                  type="checkbox"
                  checked={hasOverseasConsent}
                  onChange={(event) => {
                    setHasOverseasConsent(event.target.checked);
                  }}
                  className="mt-1 h-4 w-4 rounded border-zinc-300 text-primary focus:ring-primary"
                />
                <div className="space-y-2">
                  <p className="text-[15px] font-bold tracking-tight text-text-primary">
                    {t("overseasConsentTitle")}
                  </p>
                  <p className="text-[14px] leading-6 text-text-secondary whitespace-pre-line">
                    {t("overseasConsentBody")}
                  </p>
                </div>
              </label>
            </section>

            <section className="rounded-content border border-dashed border-border bg-sub-background/60 p-4 md:p-5">
              <div className="flex items-start gap-3">
                <DowinIcon
                  name="status-info"
                  size="16px"
                  className="mt-0.5 shrink-0 opacity-60"
                />
                <div className="space-y-3 text-[14px] leading-6 text-text-secondary">
                  <p>{t("policyLinksTitle")}</p>
                  <div className="flex flex-wrap gap-3 font-bold text-primary">
                    <Link href="/privacy">{t("privacyLink")}</Link>
                    <Link href="/terms">{t("termsLink")}</Link>
                    <Link href="/billing-policy">{t("billingPolicyLink")}</Link>
                  </div>
                  <p>{t("alternativeContact", { email: SUPPORT_EMAIL })}</p>
                </div>
              </div>
            </section>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                className={`inline-flex h-12 items-center justify-center px-5 text-[14px] font-black tracking-tight ${
                  isReady
                    ? "bg-primary text-white hover:bg-primary/90"
                    : "cursor-not-allowed bg-zinc-200 text-zinc-400"
                }`}
              >
                <a
                  href={isReady ? TALLY_CONTACT_URL : undefined}
                  target="_blank"
                  rel="noreferrer"
                  aria-disabled={!isReady}
                  onClick={(event) => {
                    if (!isReady) {
                      event.preventDefault();
                    }
                  }}
                >
                  {t("continueButton")}
                </a>
              </Button>

              <Button
                asChild
                className="inline-flex h-12 items-center justify-center border border-zinc-200 bg-white px-5 text-[14px] font-black tracking-tight text-text-primary hover:bg-zinc-50"
              >
                <Link href={isAuthenticated ? "/profile" : "/"}>
                  {t("cancelButton")}
                </Link>
              </Button>
            </div>
          </div>
        </Card>

        {!isAuthenticated ? <Footer /> : null}
      </div>
    </main>
  );
}
