import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, isNavActive } from "@/components/navigation/nav-config";
import { BrandMark } from "@/components/brand/brand-mark";
import { DesktopSidebar } from "@/components/navigation/desktop-sidebar";
import { MobileTopBar } from "@/components/navigation/mobile-top-bar";
import { MobileBottomNav } from "@/components/navigation/mobile-bottom-nav";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/"),
}));

describe("nav-config and isNavActive", () => {
  it("defines four core navigation items", () => {
    expect(NAV_ITEMS).toHaveLength(4);
    expect(NAV_ITEMS.map((item) => item.label)).toEqual([
      "Home",
      "Analyze",
      "Activity",
      "Help",
    ]);
  });

  it("evaluates active state correctly for root route", () => {
    expect(isNavActive("/", "/")).toBe(true);
    expect(isNavActive("/analyze", "/")).toBe(false);
    expect(isNavActive("/activity", "/")).toBe(false);
  });

  it("evaluates active state correctly for subpaths and dynamic routes", () => {
    expect(isNavActive("/activity", "/activity")).toBe(true);
    expect(isNavActive("/activity/dec_12345", "/activity")).toBe(true);
    expect(isNavActive("/activity/dec_12345/details", "/activity")).toBe(true);
    expect(isNavActive("/analyze", "/analyze")).toBe(true);
    expect(isNavActive("/analyze/scam-text", "/analyze")).toBe(true);
    expect(isNavActive("/help", "/activity")).toBe(false);
  });
});

describe("BrandMark component", () => {
  it("renders ShieldCheck logo with restrained multicolor title", () => {
    const { container } = render(<BrandMark size="md" />);
    expect(screen.getByText("UPI")).toBeVisible();
    expect(screen.getByText("Shield")).toBeVisible();
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});

describe("DesktopSidebar component", () => {
  it("renders desktop sidebar with brand mark, all nav items, and prototype disclosure", () => {
    vi.mocked(usePathname).mockReturnValue("/activity/dec_123");

    render(<DesktopSidebar />);

    const nav = screen.getByRole("navigation", { name: "Desktop navigation" });
    expect(nav).toBeInTheDocument();

    const activityLink = screen.getByRole("link", { name: "Activity" });
    const homeLink = screen.getByRole("link", { name: "Home" });
    const analyzeLink = screen.getByRole("link", { name: "Analyze" });
    const helpLink = screen.getByRole("link", { name: "Help" });

    expect(activityLink).toHaveAttribute("aria-current", "page");
    expect(homeLink).not.toHaveAttribute("aria-current");
    expect(analyzeLink).not.toHaveAttribute("aria-current");
    expect(helpLink).not.toHaveAttribute("aria-current");

    expect(
      screen.getByText(/UPI Shield is an independent simulator/)
    ).toBeVisible();
  });
});

describe("MobileBottomNav component", () => {
  it("renders mobile bottom navigation with 4 items and safe active route semantics", () => {
    vi.mocked(usePathname).mockReturnValue("/analyze/nested");

    render(<MobileBottomNav />);

    const nav = screen.getByRole("navigation", { name: "Mobile navigation" });
    expect(nav).toBeInTheDocument();

    const analyzeLink = screen.getByRole("link", { name: "Analyze" });
    const homeLink = screen.getByRole("link", { name: "Home" });

    expect(analyzeLink).toHaveAttribute("aria-current", "page");
    expect(homeLink).not.toHaveAttribute("aria-current");
  });
});

describe("MobileTopBar component", () => {
  it("renders mobile header with brand mark", () => {
    render(<MobileTopBar />);
    expect(screen.getByText("UPI")).toBeVisible();
    expect(screen.getByText("Shield")).toBeVisible();
  });
});
