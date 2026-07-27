import * as React from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/ui/class-names";

export type TextLinkVariant = "primary" | "quiet" | "danger";

export interface TextLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  variant?: TextLinkVariant;
  isExternal?: boolean;
  disabled?: boolean;
}

const variantStyles: Record<TextLinkVariant, string> = {
  primary:
    "text-[var(--accent-primary,#1a73e8)] hover:text-[var(--accent-primary-hover,#155fc0)] underline underline-offset-4 decoration-current",
  quiet:
    "text-[var(--text-secondary,#566074)] hover:text-[var(--text-primary,#172033)] underline underline-offset-4 decoration-current",
  danger:
    "text-[var(--state-error,#c5221f)] hover:text-[#a81c19] underline underline-offset-4 decoration-current",
};

export const TextLink = React.forwardRef<HTMLAnchorElement, TextLinkProps>(
  (
    {
      className,
      href,
      variant = "primary",
      isExternal = false,
      disabled = false,
      children,
      target,
      rel,
      onClick,
      ...props
    },
    ref
  ) => {
    const isLinkDisabled = disabled;

    const externalProps = isExternal
      ? {
          target: target || "_blank",
          rel: rel || "noopener noreferrer",
        }
      : {};

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (isLinkDisabled) {
        e.preventDefault();
        return;
      }
      if (onClick) {
        onClick(e);
      }
    };

    const linkClasses = cn(
      "inline-flex items-center text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring,#8ab4f8)] focus-visible:ring-offset-1 rounded-[4px]",
      "min-h-[44px] px-1", // 44px touch target on mobile
      variantStyles[variant],
      isLinkDisabled &&
        "opacity-50 pointer-events-none cursor-not-allowed no-underline",
      className
    );

    if (isExternal || href.startsWith("http://") || href.startsWith("https://")) {
      return (
        <a
          ref={ref}
          href={href}
          onClick={handleClick}
          aria-disabled={isLinkDisabled ? true : undefined}
          tabIndex={isLinkDisabled ? -1 : undefined}
          className={linkClasses}
          {...externalProps}
          {...props}
        >
          <span>{children}</span>
          {isExternal && (
            <ExternalLink
              className="ml-1 h-3.5 w-3.5 shrink-0"
              aria-hidden="true"
            />
          )}
        </a>
      );
    }

    return (
      <Link
        ref={ref}
        href={href}
        onClick={handleClick}
        aria-disabled={isLinkDisabled ? true : undefined}
        tabIndex={isLinkDisabled ? -1 : undefined}
        className={linkClasses}
        {...props}
      >
        <span>{children}</span>
      </Link>
    );
  }
);

TextLink.displayName = "TextLink";
