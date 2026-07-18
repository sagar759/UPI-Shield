import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const WCAG_TAGS = [
  "wcag2a",
  "wcag2aa",
  "wcag21a",
  "wcag21aa",
  "wcag22aa",
];

test("navigates to the root route without browser or WCAG errors", async ({
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

  const response = await page.goto("/");

  expect(response?.ok()).toBe(true);
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText("UPI Fraud Shield", { exact: true })).toBeVisible();

  const accessibilityScan = await new AxeBuilder({ page })
    .withTags(WCAG_TAGS)
    .analyze();
  const violations = accessibilityScan.violations.map(
    ({ id, impact, nodes }) => ({
      id,
      impact,
      nodes: nodes.length,
    }),
  );

  expect(violations).toEqual([]);
  expect(browserErrors).toEqual([]);
});
