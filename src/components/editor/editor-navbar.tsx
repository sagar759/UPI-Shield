"use client";

import type { ReactNode } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { cn } from "@/lib/utils";

export interface EditorNavbarProps {
  isSidebarOpen: boolean;
  onSidebarToggle: () => void;
  centerContent?: ReactNode;
  className?: string;
}

export function EditorNavbar({
  isSidebarOpen,
  onSidebarToggle,
  centerContent,
  className,
}: EditorNavbarProps) {
  const toggleLabel = isSidebarOpen
    ? "Close projects sidebar"
    : "Open projects sidebar";

  return (
    <header
      className={cn(
        "relative z-navigation grid h-14 shrink-0 grid-cols-[1fr_auto_1fr] items-center border-b border-fg-secondary bg-fg-primary px-3 text-surface",
        className,
      )}
    >
      <div className="flex min-w-0 items-center justify-start">
        <button
          type="button"
          className="inline-flex size-control-compact items-center justify-center rounded-control text-surface transition-colors duration-fast ease-standard hover:bg-fg-secondary"
          aria-label={toggleLabel}
          aria-expanded={isSidebarOpen}
          title={toggleLabel}
          onClick={onSidebarToggle}
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="size-icon-md" aria-hidden="true" />
          ) : (
            <PanelLeftOpen className="size-icon-md" aria-hidden="true" />
          )}
        </button>
      </div>

      <div className="min-w-0 text-center text-panel-title font-ui-semibold">
        {centerContent}
      </div>

      <div aria-hidden="true" />
    </header>
  );
}
