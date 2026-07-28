"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import type { DemoContact } from "@/data/demo/contacts";
import { maskVPA } from "@/lib/privacy/mask";
import { buildAnalyzerUrl } from "@/lib/navigation/analyzer-intent";
import { cn } from "@/lib/utils";

export interface ContactItemProps extends React.ComponentProps<"div"> {
  contact: DemoContact;
}

/**
 * Extracts clean 2-letter uppercase initials from display name.
 */
function getInitials(name: string): string {
  // Strip parentheses content e.g. "Ramesh Verma (Landlord)" -> "Ramesh Verma"
  const cleanName = name.replace(/\(.*\)/, "").trim();
  const parts = cleanName.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Generates deterministic avatar background colors based on contact category/ID.
 */
function getAvatarBgColor(category: DemoContact["category"]): string {
  switch (category) {
    case "landlord":
      return "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800";
    case "friend":
      return "bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300 border-sky-200 dark:border-sky-800";
    case "merchant":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
    case "medical":
      return "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800";
    default:
      return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700";
  }
}

export function ContactItem({ contact, className, ...props }: ContactItemProps) {
  const initials = getInitials(contact.displayName);
  const maskedVpa = maskVPA(contact.vpa);
  const avatarColors = getAvatarBgColor(contact.category);
  const targetHref = buildAnalyzerUrl({
    mode: "pay-contact",
    contactId: contact.contactId,
  });

  return (
    <div className={cn("shrink-0", className)} {...props}>
      <Link
        href={targetHref}
        aria-label={`Select ${contact.displayName}, VPA ${maskedVpa} for simulated payment analysis`}
        title={`Analyze payment to ${contact.displayName} (${maskedVpa})`}
        className={cn(
          // Touch target size >= 64px x 64px interactive target area
          "min-h-[80px] min-w-[140px] sm:min-w-[160px] p-3 rounded-panel border border-border bg-surface hover:bg-surface-subtle hover:border-accent-primary/40 focus-visible:outline-focus transition-all flex flex-col items-center text-center gap-2 relative group"
        )}
      >
        {/* Avatar Container with Initials and optional Verified Badge */}
        <div className="relative">
          <div
            className={cn(
              "size-10 rounded-pill font-ui-bold text-caption-sm flex items-center justify-center border shadow-subtle group-hover:scale-105 transition-transform",
              avatarColors
            )}
            aria-hidden="true"
          >
            {initials}
          </div>

          {contact.isVerifiedMerchant && (
            <div
              aria-label="Verified Merchant"
              title="Verified Merchant"
              className="absolute -bottom-1 -right-1 bg-surface rounded-pill p-0.5 shadow-subtle text-emerald-600 dark:text-emerald-400"
            >
              <CheckCircle2 className="size-3.5 fill-emerald-100 dark:fill-emerald-950" />
            </div>
          )}
        </div>

        {/* Contact Info */}
        <div className="flex flex-col items-center gap-0.5 w-full min-w-0">
          <span className="text-body-sm font-ui-semibold text-fg-primary group-hover:text-accent-primary transition-colors truncate max-w-full">
            {contact.displayName}
          </span>
          <span className="text-caption text-fg-muted font-mono truncate max-w-full">
            {maskedVpa}
          </span>
        </div>
      </Link>
    </div>
  );
}
