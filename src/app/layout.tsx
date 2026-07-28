import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { DesktopSidebar } from "@/components/navigation/desktop-sidebar";
import { MobileTopBar } from "@/components/navigation/mobile-top-bar";
import { MobileBottomNav } from "@/components/navigation/mobile-bottom-nav";
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
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-surface focus:text-fg-primary focus:p-4 focus:border focus:border-border focus:rounded-control focus:outline-focus"
          >
            Skip to content
          </a>

          <div className="flex flex-1 flex-col min-[900px]:flex-row">
            {/* Desktop Navigation Sidebar */}
            <DesktopSidebar />

            {/* Mobile Header & Main Page Container */}
            <div className="flex flex-1 flex-col min-w-0 pb-[68px] min-[900px]:pb-0">
              <MobileTopBar />

              <main
                id="main-content"
                tabIndex={-1}
                className="flex-1 focus:outline-none"
              >
                {children}
              </main>

              {/* Mobile Prototype Disclosure */}
              <div className="flex min-[900px]:hidden p-4 border-t border-border bg-surface-subtle text-[11px] text-fg-secondary leading-relaxed">
                <strong>Prototype Disclosure:</strong> UPI Shield is an independent simulator and does not move money or contact a bank, police, 1930, or NCRP.
              </div>
            </div>
          </div>

          {/* Mobile Bottom Navigation Bar */}
          <MobileBottomNav />
        </div>
      </body>
    </html>
  );
}
