"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type LiveRegionMode = "polite" | "assertive";

export interface LiveRegionProps {
  message?: string | null;
  mode?: LiveRegionMode;
  className?: string;
  /** Deduplication window in milliseconds. Messages identical to previous within window are ignored. Defaults to 3000ms. */
  dedupeTimeMs?: number;
}

/**
 * Visually hidden aria-live region component that announces status updates once using deduplication.
 */
export function LiveRegion({
  message,
  mode = "polite",
  className,
  dedupeTimeMs = 3000,
}: LiveRegionProps) {
  const [announcedMessage, setAnnouncedMessage] = React.useState<string>("");
  const lastAnnouncedRef = React.useRef<{ text: string; time: number }>({
    text: "",
    time: 0,
  });

  React.useEffect(() => {
    if (!message || !message.trim()) {
      return;
    }

    const trimmed = message.trim();
    const now = Date.now();
    const isDuplicate =
      lastAnnouncedRef.current.text === trimmed &&
      now - lastAnnouncedRef.current.time < dedupeTimeMs;

    if (!isDuplicate) {
      lastAnnouncedRef.current = { text: trimmed, time: now };
      setAnnouncedMessage(trimmed);
    }
  }, [message, dedupeTimeMs]);

  return (
    <div
      data-slot="live-region"
      aria-live={mode}
      aria-atomic="true"
      className={cn("sr-only", className)}
    >
      {announcedMessage}
    </div>
  );
}

// React Context for programmatic live announcements across application
interface LiveAnnouncerContextValue {
  announcePolite: (message: string) => void;
  announceAssertive: (message: string) => void;
}

const LiveAnnouncerContext = React.createContext<LiveAnnouncerContextValue | null>(
  null
);

export function LiveRegionProvider({ children }: { children: React.ReactNode }) {
  const [politeMsg, setPoliteMsg] = React.useState<string>("");
  const [assertiveMsg, setAssertiveMsg] = React.useState<string>("");

  const announcePolite = React.useCallback((message: string) => {
    setPoliteMsg(message);
  }, []);

  const announceAssertive = React.useCallback((message: string) => {
    setAssertiveMsg(message);
  }, []);

  return (
    <LiveAnnouncerContext.Provider value={{ announcePolite, announceAssertive }}>
      {children}
      <LiveRegion message={politeMsg} mode="polite" />
      <LiveRegion message={assertiveMsg} mode="assertive" />
    </LiveAnnouncerContext.Provider>
  );
}

export function useLiveAnnouncer() {
  const context = React.useContext(LiveAnnouncerContext);
  if (!context) {
    // Return fallback standalone callers if rendered outside provider
    return {
      announcePolite: () => {},
      announceAssertive: () => {},
    };
  }
  return context;
}
