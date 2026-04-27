import { describe, expect, it } from "vitest";
import { detectLocale, resolveLocale } from "@/i18n/detect-locale";

describe("detectLocale", () => {
  it("Accept-Language가 ko로 시작하면 한국어를 반환한다", () => {
    expect(detectLocale({ acceptLanguage: "ko-KR,ko;q=0.9,en;q=0.8" })).toBe(
      "ko",
    );
  });

  it("Accept-Language가 없으면 기본값 ko를 반환한다", () => {
    expect(detectLocale({})).toBe("ko");
  });
});

describe("resolveLocale", () => {
  it("custom locale이 있으면 쿠키보다 우선한다", () => {
    expect(
      resolveLocale({
        customLocale: "en",
        cookieLocale: "ko",
        acceptLanguage: "ko-KR,ko;q=0.9",
      }),
    ).toBe("en");
  });

  it("cookie locale은 Accept-Language보다 우선한다", () => {
    expect(
      resolveLocale({
        cookieLocale: "en",
        acceptLanguage: "ko-KR,ko;q=0.9",
      }),
    ).toBe("en");
  });
});
