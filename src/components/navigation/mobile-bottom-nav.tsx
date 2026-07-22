"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, isNavActive } from "./nav-config";

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <div className="flex min-[900px]:hidden fixed bottom-0 left-0 right-0 h-[60px] border-t border-border bg-surface shadow-mobile-nav z-navigation pb-safe">
      <nav
        aria-label="Mobile navigation"
        className="grid grid-cols-4 w-full h-full items-center px-1"
      >
        {NAV_ITEMS.map((item) => {
          const active = isNavActive(pathname, item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 rounded-control min-h-[44px] min-w-[44px] px-1 py-1 w-full text-center transition-colors duration-fast ease-standard focus-visible:outline-focus select-none",
                active
                  ? "bg-surface-subtle text-action-hover font-ui-bold border-t-2 border-action rounded-t-none"
                  : "text-fg-secondary hover:bg-surface-subtle hover:text-fg-primary font-ui-regular"
              )}
            >
              <Icon
                className={cn(
                  "size-icon-sm shrink-0 transition-colors duration-fast ease-standard",
                  active ? "text-action-hover" : "text-fg-secondary"
                )}
                aria-hidden="true"
              />
              <span className="text-[11px] leading-tight truncate max-w-full w-full px-0.5">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
