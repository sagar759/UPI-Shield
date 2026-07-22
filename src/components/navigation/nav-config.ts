import { LucideIcon, Home, Search, Activity, HelpCircle } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/analyze", label: "Analyze", icon: Search },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/help", label: "Help", icon: HelpCircle },
];

/**
 * Determines if a route is currently active based on the current pathname.
 * Root route ('/') requires exact match. Sub-routes match either exact path or nested subpaths.
 */
export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
