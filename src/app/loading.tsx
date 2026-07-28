"use client";

import { LoadingState } from "@/components/ui/loading-state";

export default function Loading() {
  return (
    <div className="p-page-gutter max-w-content-max mx-auto flex flex-col items-center justify-center min-h-[50vh] text-center">
      <LoadingState message="Scanning status..." />
    </div>
  );
}
