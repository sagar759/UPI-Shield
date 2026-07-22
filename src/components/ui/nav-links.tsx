"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Activity, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavLinksProps {
  className?: string;
  mobile?: boolean;
}

export function NavLinks({ className, mobile = false }: NavLinksProps) {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Home", icon: Home },
    { href: "/analyze", label: "Analyze", icon: Search },
    { href: "/activity", label: "Activity", icon: Activity },
    { href: "/help", label: "Help", icon: HelpCircle },
  ];

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <nav
      className={cn(
        mobile ? "flex w-full justify-around items-center h-full" : "flex flex-col gap-1 w-full",
        className
      )}
      aria-label={mobile ? "Mobile navigation" : "Desktop navigation"}
    >
      {links.map((link) => {
        const active = isActive(link.href);
        const Icon = link.icon;

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-control text-body-sm font-ui-semibold transition-colors duration-fast ease-standard focus-visible:outline-focus",
              active
                ? "bg-surface-subtle text-action-hover"
                : "text-fg-secondary hover:bg-surface-subtle hover:text-fg-primary",
              mobile
                ? "flex-col gap-1 px-3 py-1 min-w-[72px] min-h-[44px] justify-center items-center text-[10px]"
                : "px-3 py-2.5 min-h-[44px]"
            )}
          >
            <Icon
              className={cn(
                "shrink-0",
                mobile ? "size-icon-sm" : "size-icon-md",
                active ? "text-action-hover" : "text-fg-secondary group-hover:text-fg-primary"
              )}
              aria-hidden="true"
            />
            <span className={cn(mobile ? "text-[11px] leading-tight" : "text-body-sm")}>
              {link.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
