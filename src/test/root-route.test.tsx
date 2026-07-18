import { render, screen } from "@testing-library/react";
import { configureAxe } from "jest-axe";
import { describe, expect, it } from "vitest";

import Home from "@/app/page";

const WCAG_TAGS = [
  "wcag2a",
  "wcag2aa",
  "wcag21a",
  "wcag21aa",
  "wcag22aa",
];

// jsdom has no layout/canvas; the Playwright axe test covers contrast in Chromium.
const axe = configureAxe({
  rules: {
    "color-contrast": { enabled: false },
  },
});

describe("root route", () => {
  it("renders the current page without WCAG violations", async () => {
    const { container } = render(<Home />);

    expect(screen.getByText("UPI Fraud Shield")).toBeVisible();

    const results = await axe(container, {
      runOnly: {
        type: "tag",
        values: WCAG_TAGS,
      },
    });

    expect(results.violations).toEqual([]);
  });
});
