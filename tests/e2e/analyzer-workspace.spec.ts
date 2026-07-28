import { expect, test } from "@playwright/test";

test.describe("Analyzer Workspace Specification 16 E2E", () => {
  test("renders 3-option segmented control and switches modes cleanly", async ({ page }) => {
    await page.goto("/analyze");

    // 1. Check title heading & initial default mode (Transaction)
    await expect(page.getByRole("heading", { name: "Risk Analyzer" })).toBeVisible();

    const modeGroup = page.getByRole("radiogroup", { name: "Select risk analyzer mode" });
    await expect(modeGroup).toBeVisible();

    const txRadio = page.getByRole("radio", { name: "Transaction" });
    const msgRadio = page.getByRole("radio", { name: "Scam message" });
    const rxRadio = page.getByRole("radio", { name: "Receiver" });

    await expect(txRadio).toBeVisible();
    await expect(msgRadio).toBeVisible();
    await expect(rxRadio).toBeVisible();

    await expect(txRadio).toHaveAttribute("aria-checked", "true");
    await expect(page.getByRole("heading", { name: "Transaction Risk Assessment" })).toBeVisible();

    // 2. Switch to Scam message mode
    await msgRadio.click();
    await expect(msgRadio).toHaveAttribute("aria-checked", "true");
    await expect(page.getByRole("heading", { name: "Scam Message Inspector" })).toBeVisible();
    await expect(page).toHaveURL(/\/analyze\?mode=message/);

    // 3. Switch to Receiver mode
    await rxRadio.click();
    await expect(rxRadio).toHaveAttribute("aria-checked", "true");
    await expect(page.getByRole("heading", { name: "Mule Receiver Analysis" })).toBeVisible();
    await expect(page).toHaveURL(/\/analyze\?mode=receiver/);
  });

  test("preserves draft inputs independently when switching between modes", async ({ page }) => {
    await page.goto("/analyze");

    // 1. Enter transaction amount
    const amountInput = page.getByLabel("Transaction Amount");
    await amountInput.fill("25000");
    await expect(amountInput).toHaveValue("25000");

    // 2. Switch to Scam message mode and enter message text
    await page.getByRole("radio", { name: "Scam message" }).click();
    const msgInput = page.getByLabel("Scam Message Text or Transcript");
    await msgInput.fill("Urgent transfer needed to unblock digital arrest");
    await expect(msgInput).toHaveValue("Urgent transfer needed to unblock digital arrest");

    // 3. Switch back to Transaction mode and verify amount is preserved
    await page.getByRole("radio", { name: "Transaction" }).click();
    await expect(amountInput).toHaveValue("25000");

    // 4. Switch back to Scam message mode and verify message text is preserved
    await page.getByRole("radio", { name: "Scam message" }).click();
    await expect(msgInput).toHaveValue("Urgent transfer needed to unblock digital arrest");
  });

  test("normalizes URL search params for contact selection intent", async ({ page }) => {
    await page.goto("/analyze?mode=pay-contact&contactId=contact_landlord_001");

    await expect(page.getByRole("radio", { name: "Transaction" })).toHaveAttribute("aria-checked", "true");
    await expect(page.getByText("Ramesh Verma (Landlord)")).toBeVisible();
  });

  test("has zero horizontal overflow on 360px mobile viewports", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/analyze");

    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    expect(hasHorizontalOverflow).toBe(false);
  });
});
