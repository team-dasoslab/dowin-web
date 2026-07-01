/* eslint-disable @next/next/no-img-element */

"use client";

import { Card } from "@/components/ui/Card";
import { DowinIcon } from "@/components/ui/DowinIcon";
import { useState } from "react";

interface GuideImageProps {
  alt: string;
  src: string;
}

export function GuideImage({ alt, src }: GuideImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <Card className="mx-auto flex w-full max-w-[326px] items-center justify-center border border-dashed border-border bg-sub-background/70 text-center" radius="2xl" padding="lg">
        <div className="space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-text-muted shadow-sm">
            <DowinIcon name="domain-image-off" size="20px" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-text-primary">
              캡처 이미지를 여기에 넣어주세요
            </p>
            <p className="text-[11px] leading-relaxed text-text-muted">{src}</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[326px] overflow-hidden rounded-[1.75rem] border border-border bg-white shadow-[0_18px_48px_rgba(17,24,39,0.08)]">
      <div className="border-b border-border bg-sub-background px-4 py-3">
        <div className="mx-auto h-1.5 w-16 rounded-full bg-border" />
      </div>
      <img
        alt={alt}
        className="h-auto w-full"
        loading="lazy"
        onError={() => setHasError(true)}
        src={src}
      />
    </div>
  );
}
