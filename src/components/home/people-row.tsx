"use client";

import * as React from "react";
import { Users } from "lucide-react";
import { DEMO_CONTACTS, type DemoContact } from "@/data/demo/contacts";
import { ContactItem } from "./contact-item";
import { cn } from "@/lib/utils";

export interface PeopleRowProps extends React.ComponentProps<"section"> {
  contacts?: DemoContact[];
}

export function PeopleRow({
  contacts = DEMO_CONTACTS,
  className,
  ...props
}: PeopleRowProps) {
  return (
    <section
      aria-labelledby="people-row-heading"
      className={cn(
        "p-5 rounded-panel border border-border bg-surface shadow-subtle flex flex-col gap-4",
        className
      )}
      {...props}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-control bg-accent-primary/10 text-accent-primary shrink-0">
            <Users className="size-icon-sm" aria-hidden="true" />
          </div>
          <div>
            <h2
              id="people-row-heading"
              className="text-panel-title font-ui-semibold text-fg-primary"
            >
              People & Recent Contacts
            </h2>
            <p className="text-caption text-fg-muted">
              Synthetic frequent payees for quick risk analysis
            </p>
          </div>
        </div>

        <span className="text-caption font-ui-medium text-fg-muted px-2 py-0.5 rounded-pill bg-surface-subtle border border-border/60">
          {contacts.length} {contacts.length === 1 ? "Contact" : "Contacts"}
        </span>
      </div>

      {/* Contact Items Container: Horizontal scroll on mobile, flex-wrap on sm+ */}
      <div
        role="region"
        aria-label="Recent contacts list"
        className="flex gap-3 overflow-x-auto pb-2 pt-1 -mx-1 px-1 snap-x scrollbar-thin scrollbar-thumb-border hover:scrollbar-thumb-fg-muted transition-colors sm:flex-wrap"
      >
        {contacts.map((contact) => (
          <ContactItem
            key={contact.contactId}
            contact={contact}
            className="snap-start"
          />
        ))}
      </div>
    </section>
  );
}
