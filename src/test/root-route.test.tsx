import { render, screen } from "@testing-library/react";
import { configureAxe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";

import Home from "@/app/page";
import AnalyzePage from "@/app/analyze/page";
import ActivityPage from "@/app/activity/page";
import DecisionDetailPage from "@/app/activity/[decisionId]/page";
import HelpPage from "@/app/help/page";
import NotFound from "@/app/not-found";
import Loading from "@/app/loading";
import ErrorBoundary from "@/app/error";
import GlobalError from "@/app/global-error";
import { NavLinks } from "@/components/ui/nav-links";
import { usePathname } from "next/navigation";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/"),
}));

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

describe("routes and pages", () => {
  it("renders the Home page without WCAG violations", async () => {
    const { container } = render(<Home />);

    expect(screen.getByRole("heading", { name: "UPI Shield Home" })).toBeVisible();

    const results = await axe(container, {
      runOnly: {
        type: "tag",
        values: WCAG_TAGS,
      },
    });

    expect(results.violations).toEqual([]);
  });

  it("renders the Analyze page", () => {
    render(<AnalyzePage />);
    expect(screen.getByRole("heading", { name: "Risk Analyzer" })).toBeVisible();
  });

  it("renders the Activity page", () => {
    render(<ActivityPage />);
    expect(screen.getByRole("heading", { name: "Decision History" })).toBeVisible();
  });

  it("renders the Decision Detail page", async () => {
    const mockParams = Promise.resolve({ decisionId: "dec_test123" });
    render(await DecisionDetailPage({ params: mockParams }));

    expect(screen.getByRole("heading", { name: "Decision Detail" })).toBeVisible();
    expect(screen.getByText("dec_test123")).toBeVisible();
  });

  it("renders the Help page", () => {
    render(<HelpPage />);
    expect(screen.getByRole("heading", { name: "Help & Resources" })).toBeVisible();
  });

  it("renders the Not Found page", () => {
    render(<NotFound />);
    expect(screen.getByRole("heading", { name: "Page Not Found" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Go to Home" })).toHaveAttribute("href", "/");
  });

  it("renders the Loading placeholder", () => {
    render(<Loading />);
    expect(screen.getByText("Scanning status...")).toBeVisible();
  });

  it("renders the Error boundary placeholder", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const mockError = new Error("Test error");
    const mockReset = vi.fn();
    render(<ErrorBoundary error={mockError} reset={mockReset} />);

    expect(screen.getByRole("heading", { name: "Something went wrong" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Try again" })).toBeVisible();
    expect(consoleSpy).toHaveBeenCalledWith("Unhandled root error:", mockError);
    consoleSpy.mockRestore();
  });

  it("renders the GlobalError boundary placeholder", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const mockError = new Error("Test global error");
    const mockReset = vi.fn();
    render(<GlobalError error={mockError} reset={mockReset} />);

    expect(screen.getByRole("heading", { name: "Something went wrong" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Try again" })).toBeVisible();
    expect(consoleSpy).toHaveBeenCalledWith("Unhandled global root error:", mockError);
    consoleSpy.mockRestore();
  });
});

describe("NavLinks component", () => {
  it("marks active page with aria-current", () => {
    vi.mocked(usePathname).mockReturnValue("/analyze");

    render(<NavLinks />);

    const analyzeLink = screen.getByRole("link", { name: "Analyze" });
    const homeLink = screen.getByRole("link", { name: "Home" });

    expect(analyzeLink).toHaveAttribute("aria-current", "page");
    expect(homeLink).not.toHaveAttribute("aria-current");
  });
});
