"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/brand/brand-mark";
import { NAV_ITEMS, isNavActive } from "./nav-config";

export function DesktopSidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="hidden min-[900px]:flex min-[900px]:w-[236px] min-[900px]:flex-col min-[900px]:shrink-0 min-[900px]:border-r min-[900px]:border-border min-[900px]:bg-surface min-[900px]:h-screen min-[900px]:sticky min-[900px]:top-0"
      aria-label="Sidebar navigation"
    >
      {/* Brand Mark Header */}
      <div className="flex h-14 items-center border-b border-border px-4">
        <BrandMark size="lg" />
      </div>

      {/* Desktop Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <nav aria-label="Desktop navigation" className="flex flex-col gap-1 w-full">
          {NAV_ITEMS.map((item) => {
            const active = isNavActive(pathname, item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex items-center gap-3 rounded-control px-3 py-2.5 min-h-[44px] text-body-sm font-ui-semibold transition-colors duration-fast ease-standard focus-visible:outline-focus relative",
                  active
                    ? "bg-surface-subtle text-action-hover font-ui-bold border-l-2 border-action -ml-[2px] pl-[10px]"
                    : "text-fg-secondary hover:bg-surface-subtle hover:text-fg-primary"
                )}
              >
                <Icon
                  className={cn(
                    "size-icon-md shrink-0 transition-colors duration-fast ease-standard",
                    active ? "text-action-hover" : "text-fg-secondary group-hover:text-fg-primary"
                  )}
                  aria-hidden="true"
                />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Desktop Persistent Prototype Disclosure */}
      <div className="p-4 border-t border-border bg-surface-subtle text-[11px] text-fg-secondary leading-relaxed">
        <strong>Prototype Disclosure:</strong> UPI Shield is an independent simulator and does not move money or contact a bank, police, 1930, or NCRP.
      </div>
    </aside>
  );
}
