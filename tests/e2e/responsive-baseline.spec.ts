import { expect, test } from "@playwright/test";

const ROUTES_TO_TEST = [
  "/",
  "/analyze",
  "/activity",
  "/activity/dec_test123",
  "/help",
];

test.describe("Responsive Baseline & Layout Invariants", () => {
  for (const route of ROUTES_TO_TEST) {
    test(`route ${route} creates no horizontal overflow at current viewport`, async ({
      page,
    }) => {
      await page.goto(route);

      const hasHorizontalScrollbar = await page.evaluate(() => {
        return (
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth
        );
      });

      expect(hasHorizontalScrollbar).toBe(false);
    });
  }

  test("desktop layout renders sticky sidebar and main container gutters cleanly", async ({
    page,
  }) => {
    const isMobile = (page.viewportSize()?.width ?? 1440) < 900;
    if (isMobile) return;

    await page.goto("/");

    const sidebar = page.locator('aside[aria-label="Sidebar navigation"]');
    await expect(sidebar).toBeVisible();

    const sidebarBox = await sidebar.boundingBox();
    expect(sidebarBox).not.toBeNull();
    // Verify desktop sidebar width is exactly 236px (or near 236px)
    expect(sidebarBox?.width).toBeGreaterThanOrEqual(230);
    expect(sidebarBox?.width).toBeLessThanOrEqual(240);

    // Verify main content container is visible alongside sidebar
    const main = page.locator("main#main-content");
    await expect(main).toBeVisible();
  });

  test("mobile layout renders top header bar, bottom nav bar, and safe bottom padding", async ({
    page,
  }) => {
    const isMobile = (page.viewportSize()?.width ?? 1440) < 900;
    if (!isMobile) return;

    await page.goto("/");

    // 1. Mobile header top bar visible
    const topBar = page.locator("header");
    await expect(topBar).toBeVisible();

    // 2. Mobile bottom navigation bar visible
    const bottomNav = page.locator('nav[aria-label="Mobile navigation"]');
    await expect(bottomNav).toBeVisible();

    const bottomNavBox = await bottomNav.boundingBox();
    expect(bottomNavBox).not.toBeNull();
    expect(bottomNavBox?.height).toBeGreaterThanOrEqual(50);

    // 3. Verify mobile interactive navigation targets meet 44px min target size
    const navLinks = page.locator('nav[aria-label="Mobile navigation"] a');
    const count = await navLinks.count();
    expect(count).toBe(4);

    for (let i = 0; i < count; i++) {
      const link = navLinks.nth(i);
      const box = await link.boundingBox();
      expect(box).not.toBeNull();
      expect(box?.height).toBeGreaterThanOrEqual(44);
      expect(box?.width).toBeGreaterThanOrEqual(44);
    }
  });

  test("zoom at 200% preserves content readability without breaking layout", async ({
    page,
  }) => {
    await page.goto("/analyze");

    // Apply 200% zoom emulation via page style transform / CSS zoom
    await page.evaluate(() => {
      document.body.style.zoom = "200%";
    });

    await expect(page.getByRole("heading", { name: "Risk Analyzer" })).toBeVisible();

    // Verify page title and main landmark remain functional
    const main = page.locator("main#main-content");
    await expect(main).toBeVisible();
  });
});
