import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandMarkProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function BrandMark({ size = "md", className }: BrandMarkProps) {
  const iconSizeClasses = {
    sm: "size-icon-sm",
    md: "size-icon-md",
    lg: "size-icon-lg",
  };

  const textSizeClasses = {
    sm: "text-body-sm",
    md: "text-body",
    lg: "text-panel-title",
  };

  return (
    <div className={cn("flex items-center gap-2 select-none", className)}>
      <ShieldCheck
        className={cn(iconSizeClasses[size], "text-success shrink-0")}
        aria-hidden="true"
      />
      <span
        className={cn(
          textSizeClasses[size],
          "font-ui-bold tracking-ui leading-none"
        )}
      >
        <span className="text-action">UPI</span>{" "}
        <span className="text-fg-primary">Shield</span>
      </span>
    </div>
  );
}
