import { describe, expect, it } from "vitest";
import {
  getApiErrorMessage,
  getFetchErrorMessage,
} from "@/lib/client/frontend-api";

describe("getApiErrorMessage", () => {
  it("테스트 계정 제한 에러는 서버 메시지를 그대로 우선 사용한다", () => {
    const message = getApiErrorMessage(
      {
        response: {
          status: 403,
          data: {
            error: {
              code: "TEST_ACCOUNT_WRITE_RESTRICTED",
              message:
                "테스트 계정에서는 체크 기록과 프로필 아이콘 변경만 사용할 수 있어요.",
            },
          },
        },
      },
      "기능을 사용할 수 없습니다.",
    );

    expect(message).toBe(
      "테스트 계정에서는 체크 기록과 프로필 아이콘 변경만 사용할 수 있어요.",
    );
  });
});

describe("getFetchErrorMessage", () => {
  it("fetch 응답의 테스트 계정 제한 메시지를 파싱한다", async () => {
    const response = new Response(
      JSON.stringify({
        error: {
          code: "TEST_ACCOUNT_WRITE_RESTRICTED",
          message:
            "테스트 계정에서는 체크 기록과 프로필 아이콘 변경만 사용할 수 있어요.",
        },
      }),
      {
        status: 403,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    await expect(
      getFetchErrorMessage(
        response,
        "알림 설정 중 잠시 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.",
      ),
    ).resolves.toBe(
      "테스트 계정에서는 체크 기록과 프로필 아이콘 변경만 사용할 수 있어요.",
    );
  });
});
