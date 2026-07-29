# Progress Tracker

## Status

Phase 17 complete. Specification 17 (Transaction Analyzer Form) is implemented and verified. Continue with the next approved specification after `Specs-folder/17-transaction-analyzer-form.md`.

## Implemented

- Planning: product scope, architecture, UI rules, code standards, AI workflow,
  detector/data plan, privacy boundaries, and demo scenarios are documented in
  the other `contex/*.md` files.
- Spec 01: semantic CSS/Tailwind tokens, reset, accessibility utilities, Inter
  font, India locale, and prototype-safe metadata.
- Spec 02: controlled `EditorNavbar`, overlay `ProjectSidebar`, project
  creation callback, shadcn-style Radix Tabs/Dialog primitives, Lucide icons,
  and shared `cn` utility.
- Spec 03: Vitest/jsdom, React Testing Library, axe, deterministic test helpers,
  V8 coverage, and Playwright Chromium projects for 1440x900 desktop and
  360x800 mobile. Playwright uses `127.0.0.1:3100` and
  `.next-playwright`, so it can run beside the port-3000 dev server.
- Spec 04: Domain Contracts and Schema Versions. Defined strict, versioned schemas and TypeScript types for detectors, transaction inputs, message inputs, receiver inputs, risk decisions, audit records, user actions, complaint drafts, and demo scenarios. Implemented runtime validation boundaries using Zod to ensure type-safety and correct unavailable-detector scoring rules.
- Spec 05: Policy Configuration and Reason Catalog. Defined versioned prototype policy configuration (`PROTOTYPE_POLICY`, version `risk-policy/v1`) with weights: transaction (0.45), message/text (0.30), receiver/graph (0.25); thresholds: low (< 0.40), medium (>= 0.40 && < 0.70), high (>= 0.70); actions and review/degraded triggers. Created stable reason codes (`REASON_CODES`) and metadata catalog (`REASON_METADATA_CATALOG`) with load-time self-checks rejecting duplicate codes or unsupported detector ownerships. Derived `DISPLAY_LIMITS` directly from `PROTOTYPE_POLICY.limits` as the single source of truth (removing unused `minUsefulReasonsMediumHigh`). Implemented deterministic selection and tie-breaker sorting for consumer reasons. Refined duplicate-code tests to mock entries, preserving key/code invariants and asserting duplicate-code error.
- Spec 06: Formatting, Masking, and Input Validation Utilities. Implemented Indian Rupee formatting (`en-IN` full and compact forms) and localized date/time formatting with explicit `Asia/Kolkata` timezone. Implemented privacy masking for VPAs, Indian mobile numbers, transaction references (UTR/RRN), and pseudonymous account IDs. Built robust input validation checking whitespace, control characters, invalid encodings, zero/negative amounts, impossible timestamps (bounds check), and forbidden secret-like credentials (PIN, OTP, CVV, passwords) in complaint fields. Provided secure export filename generation with character allowlist (`a-zA-Z0-9_.-`) and allowed extensions (`.json`, `.csv`, `.pdf`, `.txt`).
- Spec 07: Demo Data and Scenario Catalog. Created deterministic, typed, 100% synthetic fixtures supporting UI and E2E demonstrations without embedding scoring labels in production model input objects.
- Spec 08: Local Persistence and Audit Repository. Implemented framework-independent `IDecisionRepository` with server-safe `MemoryDecisionRepository` and client `BrowserDecisionRepository` adapters.
- Spec 08 follow-ups: Updated action metadata sanitizer in `src/lib/storage/storage-schema.ts` to recursively purge sensitive keys from nested objects and arrays when `consentGiven` is false. Updated `BrowserDecisionRepository` `getHealth` read-only test in `src/test/storage.test.ts` to spy on `Storage.prototype.setItem` post-save and assert zero write operations during health checks.
- Spec 09: App Shell and Route Structure. Created semantic route skeleton (`/`, `/analyze`, `/activity`, `/activity/[decisionId]`, and `/help`) and persistent layout frame. Developed interactive `NavLinks` client component with responsive support for desktop sidebar (236px fixed width) and mobile top bar / bottom navigation. Added quiet persistent prototype disclosure (WCAG AA compliant color contrast) and keyboard-accessible skip-to-content routing. Implemented custom 404 (`not-found.tsx`), loading spinner (`loading.tsx`), and error boundary (`error.tsx`) components.
- Spec 10: Responsive Navigation. Implemented dedicated responsive navigation components: single typed configuration `nav-config.ts`, brand mark component `BrandMark`, 236px desktop navigation sidebar `DesktopSidebar`, mobile top bar `MobileTopBar`, and 4-column fixed mobile bottom navigation `MobileBottomNav`. Active route determination relies on Next.js `usePathname` and `isNavActive` helper, correctly highlighting active items on exact routes and nested subpaths (`/activity/[decisionId]`, `/analyze/*`). Active state visual design combines icon, label, text color, font weight, background shape/pill, and indicator border for clear non-color-only identification. Mobile touch targets maintain 44x44px min sizing, label overflow prevention at 320-360px viewports, visible focus rings, and safe-area content bottom padding clearance (`pb-[68px] min-[900px]:pb-0`).
- Spec 11: Shared UI and Form Primitives. Built 16 accessible, semantic UI components (`Button`, `IconButton`, `TextLink`, `TextField`, `AmountField`, `TextArea`, `Select`, `Checkbox`, `RadioGroup`, `SegmentedControl`, `FieldMessage`, `ErrorSummary`, `Panel`, `Divider`, `StatusBadge`, and `ProgressBar`) and small typed class-names helper (`src/lib/ui/class-names.ts`).
- Spec 12: Overlays, Loading, and Error Feedback. Built accessible modal/sheet overlay, screen reader announcer, loading, skeleton, empty state, degraded state, and recoverable error UI components (`src/components/ui/dialog.tsx`, `live-region.tsx`, `loading-state.tsx`, `empty-state.tsx`, `error-state.tsx`, `degraded-notice.tsx`).
- Spec 13: Accessibility and Responsive Baseline. Added reusable test helpers (`src/test/accessibility.ts` and unit tests in `src/test/accessibility.test.tsx`) for keyboard tab order, focus visibility, accessible names, dialog semantics, live regions, and color-independent status presentation. Established Playwright E2E accessibility suite (`tests/e2e/accessibility-baseline.spec.ts`) with structured CI failure logging printing failing route, viewport, element target, and axe rule ID. Added Playwright responsive baseline assertions (`tests/e2e/responsive-baseline.spec.ts`) testing 1440x900 desktop and 360x800 mobile viewports, zero horizontal page overflow (`scrollWidth <= clientWidth`), unclipped fixed navigation, minimum 44px mobile touch target bounding boxes, and 200% text zoom readability. Adjusted semantic token `--accent-primary` (`#1565c0`) in `globals.css` to guarantee WCAG AA contrast (>=4.5:1) against both base (`#f7f9fc`) and surface (`#ffffff`) backgrounds across all text and interactive controls. Added landmark navigation order, single `h1` per route shell, skip link (`sr-only focus:not-sr-only`), `forced-colors: active` high-contrast mode emulation, `prefers-reduced-motion: reduce` motion policy, and manual verification checklist (`docs/accessibility-checklist.md`).
- Spec 14: Home Protection Dashboard. Implemented responsive Home dashboard (`src/app/page.tsx` & `src/components/home/home-dashboard.tsx`) with a primary payment/activity column and a 340px protection rail on desktop (`min-[900px]`), stacking logically on mobile.
- Spec 15: Payment Actions and Contact Selection. Implemented payment shortcuts, demo scenario triggers, and frequent synthetic contacts row on the Home dashboard (`src/components/home/payment-actions.tsx`, `src/components/home/people-row.tsx`, `src/components/home/contact-item.tsx`).
  - **Analyzer Intent Helper (`src/lib/navigation/analyzer-intent.ts`)**: Defined supported analyzer intent modes (`scan-pay`, `pay-contact`, `bank-transfer`, `check-upi-id`, `demo-scenarios`) with input validation, default fallback mode (`scan-pay`), and safe URL construction.
  - **Privacy Boundary**: Guaranteed contact selection routes to `/analyze?mode=pay-contact&contactId={contactId}` with synthetic contact IDs only; unmasked VPAs are strictly prohibited in URL search parameters.
  - **Payment Actions (`PaymentActions`)**: Rendered 4 primary payment shortcuts (*Scan & pay*, *Pay contact*, *Bank transfer*, *Check UPI ID*) and *Explore Demo Scenarios* entry point with Lucide icons, clear simulated risk check disclaimers, tooltips, and >=44px touch targets.
  - **People Row & Contact Items (`PeopleRow` & `ContactItem`)**: Rendered synthetic contact cards from `DEMO_CONTACTS` with initials avatar, display name, masked VPA, and verified merchant badge. Features >=64px interactive target areas and horizontal touch-scrolling on mobile viewports without keyboard focus trapping.
  - **Testing**: Created unit tests in `src/test/navigation.test.ts` and `src/test/payment-actions.test.tsx` verifying intent validation, URL generation, VPA privacy boundaries, axe accessibility compliance, and updated `src/test/home.test.tsx`.
- Spec 16: Analyzer Workspace. Built responsive `/analyze` workspace with stable 2-column desktop layout (7 cols workflow / 5 cols result) and 1-column mobile stack (<900px).
  - **Segmented Mode Control (`AnalyzerModeControl`)**: Implemented 3-option mode selector (`transaction`, `message`, `receiver`) with keyboard accessibility, ARIA radiogroup, and overflow-free 360px layout.
  - **Workspace State Model & Draft Preservation**: Built `AnalyzerWorkspace` client container with isolated session draft states preserving form fields independently across mode switches during the session without cross-form field leakage or silent submissions.
  - **Result Region & Information Architecture (`AnalyzerResultRegion`)**: Built stable min-height result panel managing `idle` (unscored info & checked signal breakdown), `loading`, `error`, `degraded`, and `completed` states with `LiveRegion` announcements.
  - **Search State Normalization (`analyze-search-state.ts`)**: Implemented `parseAnalyzeSearchParams` and `buildAnalyzeSearchUrl` mapping Spec 15 intents (`scan-pay`, `pay-contact`, `bank-transfer`, `check-upi-id`, `demo-scenarios`) to canonical workspace modes and enforcing privacy boundary (stripping `@` from `contactId` and `scenario`).
  - **Focus & Routing**: Managed accessibility heading focus on explicit mode switches without stealing focus during typing; wrapped workspace in `Suspense` boundary on `/analyze/page.tsx` for Next.js 16 SSR/Turbopack compliance.
  - **Testing**: Added unit tests in `src/test/analyze-search-state.test.ts` and `src/test/analyzer-workspace.test.tsx` (100% coverage, axe accessibility compliant) and E2E tests in `tests/e2e/analyzer-workspace.spec.ts`.
- Spec 17: Transaction Analyzer Form. Built an ergonomic, accessible pre-payment transaction risk evaluation form complying with the v1 `TransactionCheckInputSchema` contract without initiating live transactions or calling bank APIs.
  - **Receiver Resolution (`ReceiverField`)**: Built ARIA-compliant combobox (`role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`, keyboard ArrowUp/ArrowDown/Escape/Enter navigation) resolving approved synthetic contacts (`DEMO_CONTACTS` with verbatim VPAs), and safe manual demo entry. Prominently displays synthetic prefill disclosure badges.
  - **Rupee Amount Parsing (`parseRupeeAmountInput`)**: Cleans pasted currency symbols (`₹`, `INR`, `Rs.`), spaces, and commas (`1,00,000` -> `100000`). Enforces positive finite numeric validation and demo limit ceiling (`₹5,00,000` INR limit with standard NPCI single-transaction guidance at `₹1,00,000`).
  - **Contextual Signals (`PaymentContextFields`)**: Implemented payment type/channel controls (`scan_pay`, `pay_contact`, `bank_transfer`, `check_upi`), note category select, 500-char memo description (with `detectForbiddenSecrets` rejecting PIN/OTP/CVV), dynamic failure count options (supporting 4, 6, 7, etc.), point-in-time risk signal checkboxes (`isCollectRequest`, `hasRefundContext`, `hasDeviceChange`, `hasLocationChange`, `isKnownRecurring`), and typed Spec 20 scam message integration slot (`includeMessage`).
  - **Form State & Runtime Contract (`TransactionForm` & `transaction-form-state.ts`)**: Built full touched-field validation, ref-backed callback handling, post-render focus management for `ErrorSummary`, and Zod contract builder `buildTransactionCheckInput` returning versioned `TransactionCheckInput` (`TransactionRiskInput`). Surfaced construction failures via `summaryErrors` without silent open states.
  - **Workspace Integration & Full Draft Persistence**: Updated `AnalyzerWorkspace` to persist complete `TransactionFormDraft` state across mode switches, restoring all toggles, notes, amounts, and failure counts without draft data loss.
  - **Testing**: Added unit tests in `src/test/transaction-form-state.test.ts` (12 tests) and `src/test/transaction-form.test.tsx` (6 tests, 100% axe compliant), updated `src/test/analyzer-workspace.test.tsx` (8 tests), and verified 285 unit tests + 42 Playwright E2E tests across desktop (1440x900) and mobile (360x800).
- Quality commands and fixture naming are documented in `README.md`.

## Verified

- `npm run check`: lint (eslint), typecheck (tsc), 285 unit tests in 22 test files, and production build (`next build`) passed cleanly.
- `npm run test:e2e`: 42 Playwright end-to-end tests passed across 1440x900 desktop and 360x800 mobile viewports.
- `npm run test:coverage`: passed with high coverage across domain and UI primitives.
- `git diff --check`: passed cleanly.

## Current UI

- Responsive desktop sidebar (236px width), mobile header top-bar, and 4-column fixed bottom navigation bar are fully functional with active state subpath highlighting across `/`, `/analyze`, `/activity`, `/activity/[decisionId]`, and `/help`.
- Home Protection Dashboard is active at `/` with single `h1`, Aarav Sharma profile greeting, Quick Payment Actions shortcuts (Scan & pay, Pay contact, Bank transfer, Check UPI ID, Explore Demo Scenarios), People & Recent Contacts row (with Ramesh Verma, Rohit Kumar, Gupta Super Mart, City Life Care Hospital), Recent Activity preview, 340px Protection Status rail, and Safety Tip panel.
- Accessible shared UI and form primitives (`Button`, `IconButton`, `TextLink`, `TextField`, `AmountField`, `TextArea`, `Select`, `Checkbox`, `RadioGroup`, `SegmentedControl`, `FieldMessage`, `ErrorSummary`, `Panel`, `Divider`, `StatusBadge`, `ProgressBar`, `Dialog`, `ConfirmDialog`, `LiveRegion`, `InlineSpinner`, `Skeleton`, `LoadingState`, `ErrorState`, `DegradedNotice`) are fully implemented and verified.

## Next Work

1. Continue with the next approved specification in `contex/Specs-folder/`.
2. Later phases: deterministic demo detectors, synthetic generators, FastAPI contracts, then classical model training/evaluation.

## Fixed Decisions

- Prototype only: no real payment, bank/police/government integration, or automatic complaint submission.
- Detector weights: transaction 0.45, text 0.30, graph 0.25.
- Risk bands: low <0.40, medium 0.40-0.69, high >=0.70.
- Missing signals are unavailable, never zero; use synthetic data only.
- Official reporting references: 1930 and https://cybercrime.gov.in/.

## Open Risks

- No verified genuine UPI dataset or standalone access to bank-wide graph data.
- Production thresholds, ownership, and evidence retention remain unresolved.
- `npm audit --omit=dev` (run on 2026-07-19) reports two moderate findings in Next.js 16.2.10's bundled PostCSS, as pinned in [package-lock.json](file:///c:/Users/samik/Desktop/UPI%20shield/upi_app/package-lock.json). Do not use the suggested forced downgrade to Next.js 9.3.3.
- Coverage thresholds wait until domain logic exists; WebKit is not yet validated.
