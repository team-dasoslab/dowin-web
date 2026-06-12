import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { usePutUsersMe } from "@/api/generated/profile/profile";
import { useToast } from "@/context/ToastContext";
import { usePathname, useRouter } from "@/i18n/routing";
import { renderWithProviders } from "@/test/render";

import { LocaleSwitcher } from "./LocaleSwitcher";

vi.mock("@/api/generated/profile/profile", () => ({
  usePutUsersMe: vi.fn(),
}));

const replace = vi.fn();
vi.mock("@/i18n/routing", () => ({
  usePathname: vi.fn(),
  useRouter: vi.fn(),
}));

vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");

  return {
    ...actual,
    useLocale: vi.fn(() => "ko"),
  };
});

vi.mock("@/context/ToastContext", () => ({
  useToast: vi.fn(),
}));

const mutate = vi.fn();
const showToast = vi.fn();

describe("LocaleSwitcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      replace,
    } as unknown as ReturnType<typeof useRouter>);
    vi.mocked(usePathname).mockReturnValue("/workspace-1/profile");
    vi.mocked(useToast).mockReturnValue({ showToast });
    vi.mocked(usePutUsersMe).mockReturnValue({
      mutate,
    } as unknown as ReturnType<typeof usePutUsersMe>);
  });

  it("renders the current locale and available options", () => {
    renderWithProviders(<LocaleSwitcher />);

    expect(screen.getByRole("combobox")).toHaveValue("ko");
    expect(screen.getByRole("option", { name: "한국어" })).toHaveValue("ko");
    expect(screen.getByRole("option", { name: "English" })).toHaveValue("en");
  });

  it("does not update profile when the selected locale is unchanged", () => {
    renderWithProviders(<LocaleSwitcher />);

    fireEvent.change(screen.getByRole("combobox"), {
      target: {
        value: "ko",
      },
    });

    expect(mutate).not.toHaveBeenCalled();
  });

  it("updates profile and replaces the route locale on success", () => {
    mutate.mockImplementation((_payload, options) => {
      options.onSuccess();
    });

    renderWithProviders(<LocaleSwitcher />);

    fireEvent.change(screen.getByRole("combobox"), {
      target: {
        value: "en",
      },
    });

    expect(mutate).toHaveBeenCalledWith(
      {
        data: {
          locale: "en",
        },
      },
      expect.objectContaining({
        onError: expect.any(Function),
        onSuccess: expect.any(Function),
      }),
    );
    expect(replace).toHaveBeenCalledWith("/workspace-1/profile", {
      locale: "en",
    });
  });

  it("shows an error toast when profile update fails", () => {
    mutate.mockImplementation((_payload, options) => {
      options.onError();
    });

    renderWithProviders(<LocaleSwitcher />);

    fireEvent.change(screen.getByRole("combobox"), {
      target: {
        value: "en",
      },
    });

    expect(showToast).toHaveBeenCalledWith(
      "error",
      "언어 변경에 실패했습니다.",
    );
    expect(replace).not.toHaveBeenCalled();
  });
});
