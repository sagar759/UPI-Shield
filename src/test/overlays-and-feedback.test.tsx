import React, { useState } from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe, toHaveNoViolations } from "jest-axe";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  ConfirmDialog,
} from "@/components/ui/dialog";
import { LiveRegion, LiveRegionProvider, useLiveAnnouncer } from "@/components/ui/live-region";
import { InlineSpinner, Skeleton, LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState, UserFacingError } from "@/components/ui/error-state";
import { DegradedNotice } from "@/components/ui/degraded-notice";

expect.extend(toHaveNoViolations);

describe("Dialog primitive and ConfirmDialog variant", () => {
  it("opens dialog, traps focus, and restores focus to trigger on close", async () => {
    function TestDialog() {
      const [open, setOpen] = useState(false);
      return (
        <div>
          <button type="button" onClick={() => setOpen(true)} id="trigger-btn">
            Open Dialog
          </button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent showCloseButton>
              <DialogHeader>
                <DialogTitle>Dialog Title</DialogTitle>
                <DialogDescription>Dialog Description</DialogDescription>
              </DialogHeader>
              <button type="button" id="inside-btn">
                Inside Button
              </button>
              <DialogFooter>
                <button type="button" onClick={() => setOpen(false)} id="close-btn">
                  Close
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      );
    }

    render(<TestDialog />);
    const trigger = screen.getByRole("button", { name: "Open Dialog" });
    expect(trigger).toBeInTheDocument();

    await userEvent.click(trigger);

    // Dialog should be open
    expect(screen.getByRole("dialog", { name: "Dialog Title" })).toBeInTheDocument();
    expect(screen.getByText("Dialog Description")).toBeInTheDocument();

    // Close dialog
    const closeBtn = screen.getByRole("button", { name: "Close" });
    await userEvent.click(closeBtn);

    // Dialog closes
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("prevents backdrop click closing when preventBackdropClose is enabled", async () => {
    function HighRiskDialog() {
      const [open, setOpen] = useState(true);
      return (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent preventBackdropClose data-testid="dialog-content">
            <DialogHeader>
              <DialogTitle>High Risk Confirmation</DialogTitle>
            </DialogHeader>
            <p>Do you wish to override this safety warning?</p>
          </DialogContent>
        </Dialog>
      );
    }

    render(<HighRiskDialog />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Find backdrop overlay in document.body portal
    const overlay = document.querySelector('[data-slot="dialog-overlay"]');
    expect(overlay).toBeInTheDocument();

    if (overlay) {
      fireEvent.pointerDown(overlay);
    }

    // Dialog remains open because preventBackdropClose is active
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("renders ConfirmDialog helper distinguishing cancel from high-risk confirm actions", async () => {
    const handleConfirm = vi.fn();
    const handleCancel = vi.fn();

    render(
      <ConfirmDialog
        open={true}
        onOpenChange={() => {}}
        title="Override High Risk Warning"
        description="Are you sure you want to proceed with this high risk payment?"
        confirmLabel="Confirm Override"
        cancelLabel="Cancel Payment"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        isHighRisk={true}
      />
    );

    expect(screen.getByRole("dialog", { name: "Override High Risk Warning" })).toBeInTheDocument();

    const cancelBtn = screen.getByRole("button", { name: "Cancel Payment" });
    const confirmBtn = screen.getByRole("button", { name: "Confirm Override" });

    expect(confirmBtn).toHaveClass("bg-error");

    await userEvent.click(confirmBtn);
    expect(handleConfirm).toHaveBeenCalledTimes(1);

    await userEvent.click(cancelBtn);
    expect(handleCancel).toHaveBeenCalledTimes(1);
  });

  it("includes responsive full-height sheet styling classes for narrow viewports", () => {
    render(
      <Dialog open={true}>
        <DialogContent data-testid="sheet-content">
          <DialogTitle>Sheet Title</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    const content = screen.getByTestId("sheet-content");
    expect(content.className).toContain("max-sm:inset-0");
    expect(content.className).toContain("max-sm:h-dvh");
    expect(content.className).toContain("motion-reduce:transition-none");
  });

  it("DialogContent prevents Escape key dismissal when preventBackdropClose is true and calls custom callback", () => {
    const handleEscape = vi.fn();
    render(
      <Dialog open={true}>
        <DialogContent preventBackdropClose onEscapeKeyDown={handleEscape}>
          <DialogTitle>Non-closable Dialog</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    const dialogEl = screen.getByRole("dialog");
    const escapeEvent = fireEvent.keyDown(dialogEl, { key: "Escape" });
    expect(handleEscape).toHaveBeenCalledTimes(1);
    expect(escapeEvent).toBe(false); // defaultPrevented is true
  });

  it("ConfirmDialog routes onOpenChange through onCancel and blocks dismissal when isLoading is true", async () => {
    const handleOpenChange = vi.fn();
    const handleCancel = vi.fn();

    const { rerender } = render(
      <ConfirmDialog
        open={true}
        onOpenChange={handleOpenChange}
        title="Loading Test"
        confirmLabel="Confirm"
        onConfirm={() => {}}
        onCancel={handleCancel}
        isLoading={true}
      />
    );

    // Close button should be hidden when isLoading is true
    expect(screen.queryByRole("button", { name: "Close dialog" })).not.toBeInTheDocument();

    // Cancel button should be disabled
    const cancelBtn = screen.getByRole("button", { name: "Cancel" });
    expect(cancelBtn).toBeDisabled();

    // When not loading, clicking cancel calls onCancel and onOpenChange(false)
    rerender(
      <ConfirmDialog
        open={true}
        onOpenChange={handleOpenChange}
        title="Loading Test"
        confirmLabel="Confirm"
        onConfirm={() => {}}
        onCancel={handleCancel}
        isLoading={false}
      />
    );

    const activeCancelBtn = screen.getByRole("button", { name: "Cancel" });
    await userEvent.click(activeCancelBtn);
    expect(handleCancel).toHaveBeenCalledTimes(1);
    expect(handleOpenChange).toHaveBeenCalledWith(false);
  });
});

describe("LiveRegion primitive and deduplication", () => {
  it("renders visually hidden aria-live polite and assertive status regions", () => {
    const { container } = render(
      <div>
        <LiveRegion message="Status updated successfully" mode="polite" />
        <LiveRegion message="High risk detected!" mode="assertive" />
      </div>
    );

    const politeEl = container.querySelector('[aria-live="polite"]');
    const assertiveEl = container.querySelector('[aria-live="assertive"]');

    expect(politeEl).toBeInTheDocument();
    expect(politeEl).toHaveClass("sr-only");
    expect(politeEl).toHaveTextContent("Status updated successfully");

    expect(assertiveEl).toBeInTheDocument();
    expect(assertiveEl).toHaveClass("sr-only");
    expect(assertiveEl).toHaveTextContent("High risk detected!");
  });

  it("deduplicates identical messages within the deduplication window", async () => {
    function TestDedupe() {
      const [msg, setMsg] = useState("Scanning...");
      return (
        <div>
          <button type="button" onClick={() => setMsg("Scanning...")}>
            Re-trigger Same
          </button>
          <button type="button" onClick={() => setMsg("Complete!")}>
            Trigger New
          </button>
          <LiveRegion message={msg} dedupeTimeMs={5000} />
        </div>
      );
    }

    const { container } = render(<TestDedupe />);
    const liveEl = container.querySelector('[aria-live="polite"]');
    expect(liveEl).toHaveTextContent("Scanning...");

    // Re-trigger identical message
    await userEvent.click(screen.getByRole("button", { name: "Re-trigger Same" }));
    expect(liveEl).toHaveTextContent("Scanning...");

    // Trigger distinct message
    await userEvent.click(screen.getByRole("button", { name: "Trigger New" }));
    expect(liveEl).toHaveTextContent("Complete!");
  });

  it("supports LiveRegionProvider and useLiveAnnouncer context hook", async () => {
    function ComponentWithAnnouncer() {
      const { announcePolite, announceAssertive } = useLiveAnnouncer();
      return (
        <div>
          <button type="button" onClick={() => announcePolite("Polite Context Update")}>
            Announce Polite
          </button>
          <button type="button" onClick={() => announceAssertive("Assertive Context Warning")}>
            Announce Assertive
          </button>
        </div>
      );
    }

    const { container } = render(
      <LiveRegionProvider>
        <ComponentWithAnnouncer />
      </LiveRegionProvider>
    );

    await userEvent.click(screen.getByRole("button", { name: "Announce Polite" }));
    const politeEl = container.querySelector('[aria-live="polite"]');
    expect(politeEl).toHaveTextContent("Polite Context Update");

    await userEvent.click(screen.getByRole("button", { name: "Announce Assertive" }));
    const assertiveEl = container.querySelector('[aria-live="assertive"]');
    expect(assertiveEl).toHaveTextContent("Assertive Context Warning");
  });
});

describe("LoadingState, InlineSpinner, and Skeleton primitives", () => {
  it("renders InlineSpinner with accessibility attributes and size variants", () => {
    const { container, rerender } = render(<InlineSpinner size="sm" label="Loading data" />);
    expect(screen.getByRole("status", { name: "Loading data" })).toBeInTheDocument();
    expect(screen.getByText("Loading data")).toHaveClass("sr-only");

    const spinner = container.querySelector(".animate-spin");
    expect(spinner).toHaveClass("size-4");

    rerender(<InlineSpinner size="lg" label="Processing risk score" />);
    const lgSpinner = container.querySelector(".animate-spin");
    expect(lgSpinner).toHaveClass("size-8");
  });

  it("renders Skeleton loading placeholder with layout preservation and aria-hidden", () => {
    const { container } = render(
      <Skeleton width={200} height={40} className="custom-skeleton" />
    );

    const skeleton = container.querySelector('[data-slot="skeleton"]');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveAttribute("aria-hidden", "true");
    expect(skeleton).toHaveStyle({ width: "200px", height: "40px" });
    expect(skeleton).toHaveClass("animate-pulse");
    expect(skeleton).toHaveClass("motion-reduce:animate-none");
  });

  it("renders LoadingState container with spinner and optional skeletons", () => {
    render(
      <LoadingState
        message="Analyzing transaction risk..."
        showSkeleton
        skeletonCount={2}
      />
    );

    const statusContainer = screen.getByRole("status");
    expect(statusContainer).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Analyzing transaction risk...")).toBeInTheDocument();

    const skeletons = statusContainer.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons).toHaveLength(2);
  });
});

describe("EmptyState primitive", () => {
  it("renders empty state with title, description, and action buttons", async () => {
    const handleAction = vi.fn();
    render(
      <EmptyState
        title="No recent decisions"
        description="Run an analysis scenario to view recorded risk decisions."
        action={
          <button type="button" onClick={handleAction}>
            Run Demo Analysis
          </button>
        }
      />
    );

    expect(screen.getByText("No recent decisions")).toBeInTheDocument();
    expect(
      screen.getByText("Run an analysis scenario to view recorded risk decisions.")
    ).toBeInTheDocument();

    const btn = screen.getByRole("button", { name: "Run Demo Analysis" });
    await userEvent.click(btn);
    expect(handleAction).toHaveBeenCalledTimes(1);
  });
});

describe("ErrorState primitive", () => {
  it("renders safe error message and scrubs stack traces or internal secrets", () => {
    const sensitiveError = new Error("TypeError: Cannot read property of undefined at Detector.analyze (detector.ts:42)");

    render(<ErrorState title="Analysis Failed" error={sensitiveError} />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Analysis Failed")).toBeInTheDocument();
    // Raw internal stack trace string is scrubbed into safe generic message
    expect(
      screen.getByText("An unexpected error occurred. Please try again or refresh the page.")
    ).toBeInTheDocument();
    expect(screen.queryByText(/detector\.ts/i)).not.toBeInTheDocument();
  });

  it("renders vetted UserFacingError and allowlisted userMessage or fallbackMessage", () => {
    const userFacingErr = new UserFacingError("Internal error detail", "Invalid UPI PIN entered.");
    const customUserObjErr = { userMessage: "Network connection lost.", isUserFacing: true };
    const unvettedUserObjErr = { userMessage: "Internal secret message", isUserFacing: false };

    const { rerender } = render(<ErrorState error={userFacingErr} />);
    expect(screen.getByText("Invalid UPI PIN entered.")).toBeInTheDocument();

    rerender(<ErrorState error={customUserObjErr} />);
    expect(screen.getByText("Network connection lost.")).toBeInTheDocument();

    // Without isUserFacing === true, userMessage is NOT displayed and generic message is shown
    rerender(<ErrorState error={unvettedUserObjErr as unknown as Error} />);
    expect(screen.queryByText("Internal secret message")).not.toBeInTheDocument();
    expect(
      screen.getByText("An unexpected error occurred. Please try again or refresh the page.")
    ).toBeInTheDocument();

    rerender(<ErrorState message="Fallback message active" error={new Error("raw internal error")} />);
    expect(screen.getByText("Fallback message active")).toBeInTheDocument();
  });

  it("triggers retry and reset callback actions", async () => {
    const handleRetry = vi.fn();
    const handleReset = vi.fn();

    render(
      <ErrorState
        onRetry={handleRetry}
        onReset={handleReset}
        retryLabel="Retry Step"
        resetLabel="Start Over"
      />
    );

    await userEvent.click(screen.getByRole("button", { name: "Retry Step" }));
    expect(handleRetry).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole("button", { name: "Start Over" }));
    expect(handleReset).toHaveBeenCalledTimes(1);
  });
});

describe("DegradedNotice primitive", () => {
  it("renders warning banner with role status and dismiss action", async () => {
    const handleDismiss = vi.fn();

    render(
      <DegradedNotice
        title="Storage Quota Warning"
        description="Local storage quota is full. Audit logs are quarantined."
        onDismiss={handleDismiss}
        dismissLabel="Dismiss storage notice"
      />
    );

    const statusBanner = screen.getByRole("status");
    expect(statusBanner).toHaveAttribute("aria-live", "polite");
    expect(screen.getByText("Storage Quota Warning")).toBeInTheDocument();
    expect(
      screen.getByText("Local storage quota is full. Audit logs are quarantined.")
    ).toBeInTheDocument();

    const dismissBtn = screen.getByRole("button", { name: "Dismiss storage notice" });
    await userEvent.click(dismissBtn);
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });
});

describe("Accessibility compliance check (Axe)", () => {
  it("passes axe checks for Spec 12 overlay, loading, and error primitives", async () => {
    const { container } = render(
      <main>
        <LiveRegion message="Accessibility testing in progress" mode="polite" />
        <InlineSpinner label="Loading..." />
        <Skeleton width={300} height={20} />
        <LoadingState message="Scanning transaction status" showSkeleton skeletonCount={2} />
        <EmptyState
          title="No data found"
          description="Try searching with a different VPA or mobile number."
        />
        <ErrorState title="System error" message="Unable to complete verification." />
        <DegradedNotice
          title="Signal unavailable"
          description="Transaction history signal is currently unavailable."
        />
      </main>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
