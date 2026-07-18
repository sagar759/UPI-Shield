"use client";

import { Plus, X } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export interface ProjectSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: () => void;
  className?: string;
}

interface EmptyProjectStateProps {
  title: string;
  description: string;
}

function EmptyProjectState({ title, description }: EmptyProjectStateProps) {
  return (
    <div className="flex min-h-40 flex-1 flex-col items-center justify-center rounded-panel border border-dashed border-border px-4 text-center">
      <p className="text-body-sm font-ui-semibold text-fg-primary">{title}</p>
      <p className="mt-1 max-w-52 text-supporting text-fg-muted">
        {description}
      </p>
    </div>
  );
}

export function ProjectSidebar({
  isOpen,
  onClose,
  onCreateProject,
  className,
}: ProjectSidebarProps) {
  return (
    <aside
      className={cn(
        "fixed bottom-0 left-0 top-14 z-navigation flex w-navigation max-w-[calc(100vw-var(--space-4))] flex-col border-r border-border bg-surface text-fg-primary transition-transform duration-standard ease-standard",
        isOpen
          ? "translate-x-0"
          : "pointer-events-none -translate-x-full",
        className,
      )}
      aria-label="Projects"
      aria-hidden={!isOpen}
      inert={!isOpen}
    >
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
        <h2 className="text-panel-title font-ui-semibold">Projects</h2>
        <button
          type="button"
          className="inline-flex size-control-compact items-center justify-center rounded-control text-fg-muted transition-colors duration-fast ease-standard hover:bg-surface-subtle hover:text-fg-primary"
          aria-label="Close projects sidebar"
          title="Close projects sidebar"
          onClick={onClose}
        >
          <X className="size-icon-sm" aria-hidden="true" />
        </button>
      </div>

      <Tabs defaultValue="my-projects" className="min-h-0 flex-1 gap-0 p-4">
        <TabsList className="grid w-full shrink-0 grid-cols-2">
          <TabsTrigger value="my-projects">My Projects</TabsTrigger>
          <TabsTrigger value="shared">Shared</TabsTrigger>
        </TabsList>

        <TabsContent value="my-projects" className="mt-4 flex">
          <EmptyProjectState
            title="No projects yet"
            description="Create a project to start organizing your work."
          />
        </TabsContent>

        <TabsContent value="shared" className="mt-4 flex">
          <EmptyProjectState
            title="Nothing shared with you"
            description="Projects shared with you will appear here."
          />
        </TabsContent>
      </Tabs>

      <div className="shrink-0 border-t border-border p-4">
        <button
          type="button"
          onClick={onCreateProject}
          className="inline-flex h-control w-full items-center justify-center gap-2 rounded-control bg-action px-4 text-body-sm font-ui-semibold text-surface transition-colors duration-fast ease-standard hover:bg-action-hover"
        >
          <Plus className="size-icon-sm" aria-hidden="true" />
          New Project
        </button>
      </div>
    </aside>
  );
}
