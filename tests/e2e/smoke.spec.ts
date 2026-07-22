import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const WCAG_TAGS = [
  "wcag2a",
  "wcag2aa",
  "wcag21a",
  "wcag21aa",
  "wcag22aa",
];

test("navigates to all route structure paths and checks WCAG compliance", async ({
  page,
}) => {
  const browserErrors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      browserErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    browserErrors.push(error.message);
  });

  // Determine viewport type dynamically
  const isMobile = (page.viewportSize()?.width ?? 1440) < 900;
  const navSelector = isMobile
    ? 'nav[aria-label="Mobile navigation"]'
    : 'nav[aria-label="Desktop navigation"]';

  // 1. Visit root route
  const response = await page.goto("/");
  expect(response?.ok()).toBe(true);
  await expect(page).toHaveURL(/\/$/);
  
  // Verify home h1 and desktop sidebar brand name
  await expect(page.getByRole("heading", { name: "UPI Shield Home" })).toBeVisible();
  
  // Verify persistent prototype disclosure
  await expect(
    page.locator("text=UPI Shield is an independent simulator").filter({ visible: true }).first()
  ).toBeVisible();

  // Run accessibility scan on home page
  const accessibilityScan = await new AxeBuilder({ page })
    .withTags(WCAG_TAGS)
    .analyze();
  expect(accessibilityScan.violations.map(v => ({ id: v.id, impact: v.impact }))).toEqual([]);

  // 2. Click Analyze navigation link using responsive locator
  await page.locator(`${navSelector} >> text=Analyze`).click();
  await expect(page).toHaveURL(/\/analyze$/);
  await expect(page.getByRole("heading", { name: "Risk Analyzer" })).toBeVisible();

  // 3. Click Activity navigation link
  await page.locator(`${navSelector} >> text=Activity`).click();
  await expect(page).toHaveURL(/\/activity$/);
  await expect(page.getByRole("heading", { name: "Decision History" })).toBeVisible();

  // 4. Test nested route active state on /activity/dec_test123
  await page.goto("/activity/dec_test123");
  await expect(page.getByRole("heading", { name: "Decision Detail" })).toBeVisible();
  const activeActivityLink = page.locator(`${navSelector} >> role=link[name="Activity"]`);
  await expect(activeActivityLink).toHaveAttribute("aria-current", "page");

  // 5. Click Help navigation link
  await page.locator(`${navSelector} >> text=Help`).click();
  await expect(page).toHaveURL(/\/help$/);
  await expect(page.getByRole("heading", { name: "Help & Resources" })).toBeVisible();

  // Verify no console errors occurred during the test
  expect(browserErrors).toEqual([]);
});
