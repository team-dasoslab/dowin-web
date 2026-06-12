import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  ContactInquiryCreateRequestCategory,
  ContactInquirySummaryStatus,
} from "@/api/generated/dowin.schemas";
import { renderWithProviders } from "@/test/render";

import ProfileContactPage from "./page";
import { useContactInquiryMutation } from "./_hooks/useContactInquiryMutation";
import { useGetContactInquiries } from "@/api/generated/contact/contact";

vi.mock("@/api/generated/contact/contact", () => ({
  useGetContactInquiries: vi.fn(),
}));

vi.mock("./_hooks/useContactInquiryMutation", () => ({
  useContactInquiryMutation: vi.fn(),
}));

const refetch = vi.fn();
const submit = vi.fn(async () => undefined);

describe("ProfileContactPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useGetContactInquiries).mockReturnValue({
      data: { status: 200, data: [] },
      error: null,
      isLoading: false,
      refetch,
    } as unknown as ReturnType<typeof useGetContactInquiries>);
    vi.mocked(useContactInquiryMutation).mockReturnValue({
      isSubmitting: false,
      submit,
    });
  });

  it("renders the empty inquiry list", () => {
    renderWithProviders(<ProfileContactPage />);

    expect(screen.getByRole("heading", { name: "문의하기" })).toBeInTheDocument();
    expect(screen.getByText("아직 접수한 문의가 없어요")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "문의 남기기" })).toBeInTheDocument();
  });

  it("renders existing inquiries", () => {
    vi.mocked(useGetContactInquiries).mockReturnValue({
      data: {
        status: 200,
        data: [
          {
            answerSummary: "",
            category: ContactInquiryCreateRequestCategory.BILLING,
            createdAt: "2026-06-12T01:00:00.000Z",
            id: 42,
            message: "결제 영수증을 확인하고 싶어요.",
            status: ContactInquirySummaryStatus.RECEIVED,
            subject: "결제 문의",
          },
        ],
      },
      error: null,
      isLoading: false,
      refetch,
    } as unknown as ReturnType<typeof useGetContactInquiries>);

    renderWithProviders(<ProfileContactPage />);

    expect(screen.getByText("결제 문의")).toBeInTheDocument();
    expect(screen.getByText("결제 및 환불")).toBeInTheDocument();
    expect(screen.getByText("접수됨")).toBeInTheDocument();
    expect(screen.getByText("아직 처리 결과가 등록되지 않았습니다."))
      .toBeInTheDocument();
  });

  it("renders unauthorized and server-error list states", () => {
    vi.mocked(useGetContactInquiries).mockReturnValue({
      data: undefined,
      error: { response: { status: 401 } },
      isLoading: false,
      refetch,
    } as unknown as ReturnType<typeof useGetContactInquiries>);

    const { rerender } = renderWithProviders(<ProfileContactPage />);
    expect(screen.getByText("로그인이 필요해요")).toBeInTheDocument();

    vi.mocked(useGetContactInquiries).mockReturnValue({
      data: undefined,
      error: { response: { status: 500 } },
      isLoading: false,
      refetch,
    } as unknown as ReturnType<typeof useGetContactInquiries>);

    rerender(<ProfileContactPage />);
    expect(screen.getByText("문의 목록을 불러오지 못했어요")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("opens the composer and submits inquiry form values", async () => {
    renderWithProviders(<ProfileContactPage />);

    fireEvent.click(screen.getByRole("button", { name: "문의 남기기" }));

    await screen.findByRole("heading", { name: "문의 작성" });

    fireEvent.click(screen.getByRole("button", { name: "버그 및 계정 문제" }));
    fireEvent.change(screen.getByPlaceholderText("이메일을 입력해주세요."), {
      target: { value: "  person@example.com  " },
    });
    fireEvent.change(screen.getByPlaceholderText("제목을 입력해주세요."), {
      target: { value: "  로그인 문제  " },
    });
    fireEvent.change(screen.getByPlaceholderText("문의하실 내용을 입력해주세요."), {
      target: { value: "  로그인이 되지 않습니다.  " },
    });
    fireEvent.click(
      screen.getByRole("checkbox", {
        name: /\[필수\] 문의 접수를 위한 개인정보 수집·이용에 동의합니다\./,
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "문의 접수하기" }));

    await waitFor(() => {
      expect(submit).toHaveBeenCalledWith({
        category: ContactInquiryCreateRequestCategory.BUG_OR_ACCOUNT,
        message: "로그인이 되지 않습니다.",
        privacyConsent: true,
        replyEmail: "person@example.com",
        subject: "로그인 문제",
      });
    });
  });
});
