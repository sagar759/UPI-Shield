import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const ROUTES_TO_TEST = [
  { path: "/", title: "Home", heading: "UPI Shield Home" },
  { path: "/analyze", title: "Risk Analyzer", heading: "Risk Analyzer" },
  { path: "/activity", title: "Decision History", heading: "Decision History" },
  { path: "/activity/dec_test123", title: "Decision Detail", heading: "Decision Detail" },
  { path: "/help", title: "Help & Resources", heading: "Help & Resources" },
];

const WCAG_TAGS = [
  "wcag2a",
  "wcag2aa",
  "wcag21a",
  "wcag21aa",
  "wcag22aa",
];

test.describe("Accessibility Baseline Automated Scans", () => {
  for (const route of ROUTES_TO_TEST) {
    test(`route ${route.path} passes axe WCAG AA checks with structured CI error reporting`, async ({
      page,
    }) => {
      const viewport = page.viewportSize();
      const viewportLabel = viewport ? `${viewport.width}x${viewport.height}` : "unknown-viewport";

      await page.goto(route.path);

      // Verify page document title
      await expect(page).toHaveTitle(new RegExp(route.title));

      // Verify exact single H1 heading in main shell
      const h1Heading = page.locator("main h1");
      await expect(h1Heading).toHaveCount(1);
      await expect(h1Heading).toHaveText(route.heading);

      // Run Axe automated accessibility scan
      const scanResults = await new AxeBuilder({ page })
        .withTags(WCAG_TAGS)
        .analyze();

      // Format granular failure reports for CI if violations exist
      if (scanResults.violations.length > 0) {
        const failureDetails = scanResults.violations.map((violation) => ({
          route: route.path,
          viewport: viewportLabel,
          ruleId: violation.id,
          impact: violation.impact,
          description: violation.description,
          helpUrl: violation.helpUrl,
          nodes: violation.nodes.map((node) => ({
            target: node.target,
            html: node.html,
            failureSummary: node.failureSummary,
          })),
        }));

        console.error(
          `[AXE FAILURE] Route '${route.path}' (${viewportLabel}):\n`,
          JSON.stringify(failureDetails, null, 2)
        );
      }

      // Assert zero serious or critical accessibility violations
      const seriousOrCritical = scanResults.violations.filter(
        (v) => v.impact === "serious" || v.impact === "critical"
      );
      expect(seriousOrCritical).toEqual([]);
      expect(scanResults.violations).toEqual([]);
    });
  }

  test("skip link targets main landmark and keyboard navigation reaches all navigation links", async ({
    page,
  }) => {
    await page.goto("/");

    // 1. Focus skip link
    await page.keyboard.press("Tab");
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeVisible();

    // 2. Trigger skip link via Enter
    await page.keyboard.press("Enter");
    const mainContent = page.locator("main#main-content");
    await expect(mainContent).toBeFocused();

    // 3. Tab through navigation links
    const isMobile = (page.viewportSize()?.width ?? 1440) < 900;
    const navSelector = isMobile
      ? 'nav[aria-label="Mobile navigation"]'
      : 'nav[aria-label="Desktop navigation"]';

    const navLinks = page.locator(`${navSelector} a`);
    const count = await navLinks.count();
    expect(count).toBeGreaterThanOrEqual(4);

    for (let i = 0; i < count; i++) {
      const link = navLinks.nth(i);
      await link.focus();
      await expect(link).toBeFocused();
    }
  });

  test("retains usable layout under forced-colors (high contrast) mode", async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto("/analyze");

    // Check main heading and primary container surfaces remain readable
    await expect(page.getByRole("heading", { name: "Risk Analyzer" })).toBeVisible();
    
    const isMobile = (page.viewportSize()?.width ?? 1440) < 900;
    const navSelector = isMobile
      ? 'nav[aria-label="Mobile navigation"]'
      : 'nav[aria-label="Desktop navigation"]';
    
    await expect(page.locator(navSelector)).toBeVisible();
  });

  test("honors reduced-motion preferences without breaking UI", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/activity");

    await expect(page.getByRole("heading", { name: "Decision History" })).toBeVisible();
  });
});
