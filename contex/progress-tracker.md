# Progress Tracker

## Status

Phase 14 complete. Specification 14 (Home Protection Dashboard) is implemented and verified. Continue with the next approved specification after `Specs-folder/14-home-protection-dashboard.md`.

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
  - **Greeting & Profile**: Rendered profile context using synthetic data (`DEMO_PRIMARY_PROFILE`: Aarav Sharma, `aarav****@upi`).
  - **Protection Summary (`ProtectionSummary`)**: Displays 3 active signal detectors (Transaction Behavior, Scam Message Text, Receiver Graph) with an explicit prototype explanation stating no live bank connection or live account links.
  - **Recent Activity Preview (`RecentActivityPreview`)**: Sourced through `IDecisionRepository`, rendering loading skeletons, storage-degraded state (`DegradedNotice`), empty state linking to `/analyze`, and populated/seeded audit records linking to `/activity/[decisionId]`.
  - **Safety Tip (`SafetyTip`)**: Deterministic educational UPI safety tips with manual previous/next controls, avoiding timers, auto-play, and carousels.
  - **Reserved Action Slots**: Clearly labeled placeholder containers for Payment Actions and People (for Spec 15), avoiding fake non-functional buttons or inactive controls.
  - **Design & Invariants**: Uses borders and whitespace rather than nested floating cards. Preserved single `h1` (`UPI Shield Home`) for WCAG AA compliance. Added comprehensive unit and axe accessibility tests in `src/test/home.test.tsx`.
- Quality commands and fixture naming are documented in `README.md`.

## Verified

- `npm run check`: lint (eslint), typecheck (tsc), 229 unit tests in 16 test files, and production build (`next build`) passed.
- `npm run test:e2e`: 34 Playwright end-to-end tests passed across 1440x900 and 360x800 viewports.
- `npm run test:coverage`: passed with high coverage across domain and UI primitives.
- `git diff --check`: passed cleanly.

## Current UI

- Responsive desktop sidebar (236px width), mobile header top-bar, and 4-column fixed bottom navigation bar are fully functional with active state subpath highlighting across `/`, `/analyze`, `/activity`, `/activity/[decisionId]`, and `/help`.
- Home Protection Dashboard is active at `/` with single `h1`, Aarav Sharma profile greeting, Quick Payment Actions slot, People slot, Recent Activity preview, 340px Protection Status rail, and Safety Tip panel.
- Accessible shared UI and form primitives (`Button`, `IconButton`, `TextLink`, `TextField`, `AmountField`, `TextArea`, `Select`, `Checkbox`, `RadioGroup`, `SegmentedControl`, `FieldMessage`, `ErrorSummary`, `Panel`, `Divider`, `StatusBadge`, `ProgressBar`, `Dialog`, `ConfirmDialog`, `LiveRegion`, `InlineSpinner`, `Skeleton`, `LoadingState`, `ErrorState`, `DegradedNotice`) are fully implemented and verified.

## Next Work

1. Implement Spec 15 (Payment Shortcuts and People) to populate the reserved payment and contact slots on the Home dashboard.
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
