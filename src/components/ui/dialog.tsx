"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

function Dialog(props: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger(
  props: React.ComponentProps<typeof DialogPrimitive.Trigger>,
) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal(
  props: React.ComponentProps<typeof DialogPrimitive.Portal>,
) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose(props: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 z-overlay bg-fg-primary/45 transition-opacity duration-fast ease-standard motion-reduce:transition-none",
        className
      )}
      {...props}
    />
  );
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  preventBackdropClose = false,
  onPointerDownOutside,
  onInteractOutside,
  onEscapeKeyDown,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean;
  preventBackdropClose?: boolean;
}) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        onPointerDownOutside={(e) => {
          if (preventBackdropClose) {
            e.preventDefault();
          }
          onPointerDownOutside?.(e);
        }}
        onInteractOutside={(e) => {
          if (preventBackdropClose) {
            e.preventDefault();
          }
          onInteractOutside?.(e);
        }}
        onEscapeKeyDown={(e) => {
          if (preventBackdropClose) {
            e.preventDefault();
          }
          onEscapeKeyDown?.(e);
        }}
        className={cn(
          "fixed left-1/2 top-1/2 z-dialog grid max-h-[calc(100dvh-var(--space-8))] w-[calc(100%-var(--space-8))] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto rounded-dialog border border-border bg-surface p-6 text-fg-primary shadow-dialog transition-all duration-fast ease-standard motion-reduce:transition-none",
          // Mobile narrow viewport: full-height sheet
          "max-sm:fixed max-sm:inset-0 max-sm:h-dvh max-sm:max-h-dvh max-sm:w-full max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none max-sm:border-none",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && !preventBackdropClose ? (
          <DialogPrimitive.Close
            className="absolute right-4 top-4 inline-flex size-control-compact items-center justify-center rounded-control text-fg-muted transition-colors duration-fast ease-standard hover:bg-surface-subtle hover:text-fg-primary focus-visible:outline-focus"
            aria-label="Close dialog"
            title="Close dialog"
          >
            <X className="size-icon-sm" aria-hidden="true" />
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 pr-8", className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  );
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        "text-panel-title font-ui-semibold text-fg-primary",
        className
      )}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-body-sm text-fg-secondary", className)}
      {...props}
    />
  );
}

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  isHighRisk?: boolean;
  isDestructive?: boolean;
  isLoading?: boolean;
  preventBackdropClose?: boolean;
}

function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  isHighRisk = false,
  isDestructive = false,
  isLoading = false,
  preventBackdropClose,
}: ConfirmDialogProps) {
  const shouldPreventDismissal = (preventBackdropClose ?? isHighRisk) || isLoading;

  const handleOpenChange = (nextOpen: boolean) => {
    if (isLoading) return;
    if (!nextOpen) {
      onCancel?.();
      onOpenChange(false);
    } else {
      onOpenChange(true);
    }
  };

  const handleCancel = () => {
    handleOpenChange(false);
  };

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        preventBackdropClose={shouldPreventDismissal}
        showCloseButton={!shouldPreventDismissal}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        <DialogFooter>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isLoading}
            className="inline-flex h-control items-center justify-center rounded-control border border-border bg-surface px-4 text-body-sm font-ui-medium text-fg-primary transition-colors duration-fast ease-standard hover:bg-surface-subtle focus-visible:outline-focus disabled:pointer-events-none disabled:opacity-50 min-h-[44px]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            aria-busy={isLoading ? "true" : undefined}
            className={cn(
              "inline-flex h-control items-center justify-center rounded-control px-4 text-body-sm font-ui-semibold text-surface transition-colors duration-fast ease-standard focus-visible:outline-focus disabled:pointer-events-none disabled:opacity-50 min-h-[44px]",
              isDestructive || isHighRisk
                ? "bg-error hover:bg-error/90"
                : "bg-action hover:bg-action-hover"
            )}
          >
            {isLoading ? "Processing..." : confirmLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
  ConfirmDialog,
};

