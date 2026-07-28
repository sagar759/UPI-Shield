"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InlineSpinnerProps extends React.ComponentProps<"span"> {
  size?: "sm" | "md" | "lg";
  label?: string;
}

export function InlineSpinner({
  size = "md",
  label,
  className,
  "aria-hidden": ariaHidden,
  ...props
}: InlineSpinnerProps) {
  const sizeClasses = {
    sm: "size-4 border-2",
    md: "size-6 border-2",
    lg: "size-8 border-3",
  };

  const isHidden = ariaHidden === true || ariaHidden === "true" || !label;

  return (
    <span
      role={isHidden ? undefined : "status"}
      aria-label={isHidden ? undefined : label}
      aria-hidden={isHidden ? "true" : undefined}
      className={cn("inline-flex items-center justify-center shrink-0", className)}
      {...props}
    >
      <span
        className={cn(
          "inline-block rounded-full border-border border-t-action animate-spin motion-reduce:animate-none",
          sizeClasses[size]
        )}
      />
      {!isHidden && label ? <span className="sr-only">{label}</span> : null}
    </span>
  );
}

export interface SkeletonProps extends React.ComponentProps<"div"> {
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  width,
  height,
  className,
  style,
  ...props
}: SkeletonProps) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        ...style,
      }}
      className={cn(
        "rounded-control bg-surface-subtle animate-pulse motion-reduce:animate-none border border-border/40",
        className
      )}
      {...props}
    />
  );
}

export interface LoadingStateProps extends React.ComponentProps<"div"> {
  message?: string;
  showSkeleton?: boolean;
  skeletonCount?: number;
  skeletonHeight?: string | number;
}

export function LoadingState({
  message = "Loading...",
  showSkeleton = false,
  skeletonCount = 3,
  skeletonHeight = 40,
  className,
  ...props
}: LoadingStateProps) {
  return (
    <div
      data-slot="loading-state"
      role="status"
      aria-busy="true"
      className={cn(
        "flex flex-col items-center justify-center p-6 text-center gap-4 min-h-[160px] w-full",
        className
      )}
      {...props}
    >
      <InlineSpinner size="lg" aria-hidden="true" />
      {message ? (
        <p className="text-body-sm font-ui-medium text-fg-secondary">
          {message}
        </p>
      ) : null}

      {showSkeleton ? (
        <div className="w-full flex flex-col gap-3 mt-2" aria-hidden="true">
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <Skeleton key={i} height={skeletonHeight} className="w-full" />
          ))}
        </div>
      ) : null}
    </div>
  );
}
