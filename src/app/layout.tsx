import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ShieldCheck } from "lucide-react";
import { NavLinks } from "@/components/ui/nav-links";
import "./globals.css";

const inter = Inter({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "UPI Shield",
    template: "%s | UPI Shield",
  },
  description:
    "An AI-assisted fraud-prevention layer for digital payments. Assess risk, detect mule accounts, and analyze scam chat language before sending money.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-IN" className={inter.variable}>
      <body className="bg-page text-fg-primary font-sans antialiased min-h-dvh">
        <div className="flex min-h-screen flex-col min-h-dvh">
          {/* Accessibility Skip Link */}
          <a
            href="#main-content"
            className="visually-hidden focus:not-visually-hidden focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-surface focus:text-fg-primary focus:p-4 focus:border focus:border-border focus:rounded-control"
          >
            Skip to content
          </a>

          <div className="flex flex-1 flex-col min-[900px]:flex-row">
            {/* Desktop Navigation Sidebar */}
            <aside
              className="hidden min-[900px]:flex min-[900px]:w-[236px] min-[900px]:flex-col min-[900px]:shrink-0 min-[900px]:border-r min-[900px]:border-border min-[900px]:bg-surface min-[900px]:h-screen min-[900px]:sticky min-[900px]:top-0"
              aria-label="Sidebar navigation"
            >
              {/* Brand Mark */}
              <div className="flex h-14 items-center border-b border-border px-4 gap-2">
                <ShieldCheck
                  className="size-icon-lg text-success shrink-0"
                  aria-hidden="true"
                />
                <span className="text-panel-title font-ui-bold tracking-ui select-none">
                  <span className="text-action">UPI</span> Shield
                </span>
              </div>

              {/* Desktop Nav Links */}
              <div className="flex-1 overflow-y-auto px-3 py-4">
                <NavLinks />
              </div>

              {/* Desktop Disclosure */}
              <div className="p-4 border-t border-border bg-surface-subtle text-[11px] text-fg-secondary leading-relaxed">
                <strong>Prototype Disclosure:</strong> UPI Shield is an independent simulator and does not move money or contact a bank, police, 1930, or NCRP.
              </div>
            </aside>

            {/* Mobile Top Bar Header */}
            <header className="flex min-[900px]:hidden h-14 items-center justify-between border-b border-border bg-surface px-4 sticky top-0 z-sticky">
              <div className="flex items-center gap-2">
                <ShieldCheck
                  className="size-icon-md text-success shrink-0"
                  aria-hidden="true"
                />
                <span className="text-body font-ui-bold tracking-ui select-none">
                  <span className="text-action">UPI</span> Shield
                </span>
              </div>
            </header>

            {/* Main Page Content */}
            <div className="flex flex-1 flex-col min-w-0">
              <main
                id="main-content"
                tabIndex={-1}
                className="flex-1 focus:outline-none"
              >
                {children}
              </main>

              {/* Mobile Disclosure (appears at bottom of content page) */}
              <div className="flex min-[900px]:hidden p-4 border-t border-border bg-surface-subtle text-[11px] text-fg-secondary leading-relaxed mb-[60px]">
                <strong>Prototype Disclosure:</strong> UPI Shield is an independent simulator and does not move money or contact a bank, police, 1930, or NCRP.
              </div>
            </div>
          </div>

          {/* Mobile Bottom Navigation Bar */}
          <div className="flex min-[900px]:hidden fixed bottom-0 left-0 right-0 h-[60px] border-t border-border bg-surface shadow-mobile-nav z-sticky pb-safe">
            <NavLinks mobile />
          </div>
        </div>
      </body>
    </html>
  );
}
