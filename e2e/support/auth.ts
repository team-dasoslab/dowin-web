import type { Page } from "playwright/test";
import { expect } from "playwright/test";

const LOCAL_SEED_USER = {
  id: "test01",
  password: "qwer1234",
} as const;

export async function loginWithLocalSeedUser(page: Page) {
  await page.goto("/ko/login");

  await page.getByLabel("아이디").fill(LOCAL_SEED_USER.id);
  await page.getByLabel("비밀번호").fill(LOCAL_SEED_USER.password);
  await page.getByRole("button", { name: "로그인" }).click();

  await expect(page).toHaveURL(/\/ko\/[^/]+\/dashboard\/my/);
}
