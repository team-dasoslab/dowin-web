import { expect, test } from "playwright/test";
import { loginWithLocalSeedUser } from "./support/auth";

test.describe("my dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginWithLocalSeedUser(page);
  });

  test("shows the active scoreboard and weekly execution board", async ({
    page,
  }) => {
    await expect(
      page.getByRole("heading", { name: /홈/ }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "최근 4주 달성률" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "점수판" })).toBeVisible();
    await expect(page.getByText("핵심 목표").first()).toBeVisible();
    await expect(page.getByText("성공 기준").first()).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "액션 아이템" }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "주간" }),
    ).toBeVisible();
  });

  test("can switch between week and month views", async ({ page }) => {
    await page.getByRole("button", { name: "월간" }).click();

    await expect(
      page.getByRole("columnheader", { name: "기간" }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "주간" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "주간" }).click();

    await expect(
      page.getByRole("columnheader", { name: "액션 아이템" }).first(),
    ).toBeVisible();
  });

  test("can toggle a visible action item record and restore it", async ({
    page,
  }) => {
    const toggleButton = page
      .getByRole("button", { name: /액션 아이템 \d{4}-\d{2}-\d{2} 기록 토글/ })
      .first();

    await expect(toggleButton).toBeVisible();

    const firstToggleResponse = page.waitForResponse((response) => {
      const method = response.request().method();
      return (
        (method === "PUT" || method === "DELETE") &&
        response.url().includes("/lead-measures/") &&
        response.url().includes("/logs/")
      );
    });
    await toggleButton.click();
    await expect((await firstToggleResponse).ok()).toBe(true);

    const restoreResponse = page.waitForResponse((response) => {
      const method = response.request().method();
      return (
        (method === "PUT" || method === "DELETE") &&
        response.url().includes("/lead-measures/") &&
        response.url().includes("/logs/")
      );
    });
    await toggleButton.click();
    await expect((await restoreResponse).ok()).toBe(true);
  });
});
