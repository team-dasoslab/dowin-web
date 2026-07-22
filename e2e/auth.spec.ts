import { test } from "playwright/test";
import { loginWithLocalSeedUser } from "./support/auth";

test.describe("auth entry", () => {
  test("logs in with the local seed account and opens the authenticated flow", async ({
    page,
  }) => {
    await loginWithLocalSeedUser(page);
  });
});
