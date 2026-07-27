# Progress Tracker

## Status

Phase 11 complete. Specification 11 (Shared UI and Form Primitives) is implemented and verified. Continue with the next approved specification after `Specs-folder/11-shared-ui-and-form-primitives.md`.

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
  - Reason Code Inventory:
    - **Transaction Behavior (`TXN_*`)**: `TXN_AMOUNT_RATIO_HIGH`, `TXN_AMOUNT_ZSCORE_HIGH`, `TXN_NEW_PAYEE`, `TXN_HOUR_DEVIATION`, `TXN_VELOCITY_HIGH`, `TXN_FAILURES_COUNT_HIGH`, `TXN_INACTIVITY_RESUME`, `TXN_DEVICE_CHANGE`, `TXN_LOCATION_CHANGE`, `TXN_COLLECT_REQUEST`, `TXN_REFUND_CONTEXT`, `TXN_NAME_MISMATCH`.
    - **Scam Tactic (`SCAM_*`)**: `SCAM_URGENCY`, `SCAM_AUTHORITY`, `SCAM_THREAT`, `SCAM_SECRECY`, `SCAM_INVESTMENT`, `SCAM_REFUND_QR`, `SCAM_CREDENTIALS`, `SCAM_REMOTE_ACCESS`, `SCAM_RECOVERY_FEE`.
    - **Receiver Flow (`RCV_*`)**: `RCV_UNIQUE_SENDERS_HIGH`, `RCV_UNIQUE_RECEIVERS_HIGH`, `RCV_INCOMING_VALUE_HIGH`, `RCV_OUTGOING_VALUE_HIGH`, `RCV_PASS_THROUGH_RATIO_HIGH`, `RCV_SHORT_HOLDING_TIME`, `RCV_BURST_RATIO_HIGH`, `RCV_NEW_ACCOUNT`.
    - **Missing/Degraded Signals (`SIG_*`)**: `SIG_TRANSACTION_UNAVAILABLE`, `SIG_TRANSACTION_DEGRADED`, `SIG_TEXT_UNAVAILABLE`, `SIG_TEXT_DEGRADED`, `SIG_GRAPH_UNAVAILABLE`, `SIG_GRAPH_DEGRADED`.
    - **Policy Outcome (`OUT_*`)**: `OUT_LOW_RISK`, `OUT_MEDIUM_RISK`, `OUT_HIGH_RISK`, `OUT_REVIEW_REQUIRED`.
- Spec 06: Formatting, Masking, and Input Validation Utilities. Implemented Indian Rupee formatting (`en-IN` full and compact forms) and localized date/time formatting with explicit `Asia/Kolkata` timezone. Implemented privacy masking for VPAs, Indian mobile numbers, transaction references (UTR/RRN), and pseudonymous account IDs. Built robust input validation checking whitespace, control characters, invalid encodings, zero/negative amounts, impossible timestamps (bounds check), and forbidden secret-like credentials (PIN, OTP, CVV, passwords) in complaint fields. Provided secure export filename generation with character allowlist (`a-zA-Z0-9_.-`) and allowed extensions (`.json`, `.csv`, `.pdf`, `.txt`).
- Spec 07: Demo Data and Scenario Catalog. Created deterministic, typed, 100% synthetic fixtures supporting UI and E2E demonstrations without embedding scoring labels in production model input objects.
  - Fixture version: `demo-fixtures/v1`
  - Presentation Scenarios (5): `scenario-student-investment`, `scenario-refund-qr`, `scenario-digital-arrest`, `scenario-mule-receiver`, `scenario-recurring-rent`.
  - Hard Legitimate Cases (6): `scenario-first-verified-merchant`, `scenario-emergency-hospital-payment`, `scenario-travel-device-change`, `scenario-high-fan-in-merchant`, `scenario-benign-bank-warning`, `scenario-recurring-high-value-rent`.
  - Synthetic Data Catalog: Local primary user profile (`DEMO_PRIMARY_PROFILE`), counterparty profiles (`DEMO_COUNTERPARTY_PROFILES`), contact list (`DEMO_CONTACTS`), recent activity seed data (`DEMO_RECENT_ACTIVITY`), receiver point-in-time aggregate snapshots (`DEMO_RECEIVER_SNAPSHOTS`), and separate ground-truth regression expectations manifest (`REGRESSION_EXPECTATIONS`).
  - Wording Assumptions & Provenance: Scam texts cover English, Hindi transliteration (Hinglish), and Hindi using obvious synthetic placeholders (`TEST_VPA_*`, `example.invalid`, `+91 98*** ***00`). Comprehensive fixture validation tests verify Zod runtime schema parsing, referential integrity, ID uniqueness, absence of secret credentials (PIN/OTP/CVV/passwords), separation of expected labels from production inputs, hard legitimate detector challenges, and 100% deterministic reproducibility.
- Spec 08: Local Persistence and Audit Repository. Implemented framework-independent `IDecisionRepository` with server-safe `MemoryDecisionRepository` and client `BrowserDecisionRepository` adapters.
  - Storage Schema Version: `decision-storage/v1` stored under namespaced key `upi_shield_audit_store_v1`.
  - Retained Fields: Masked/synthetic inputs, detector results, final risk decision, policy versions, latency, and explicit user actions (`cancel`, `verify`, `continue`, `override`, `report`, `copy_draft`, `export_draft`). Raw message text retention defaults off and is never persisted without explicit consent.
  - Audit Immutability: Appending user actions modifies strictly the `actions` array while leaving detector scores, timestamps, and policy versions unchanged.
  - Defensive Handling & Quarantining: Defensive JSON parsing with Zod runtime validation. Corrupted payloads or invalid records are quarantined without crashing runtime execution.
  - Degraded Storage Health: Storage quota exhaustion (`degraded_quota`), corrupted storage (`degraded_corrupt`), and unavailable storage (`degraded_unavailable`) are tracked as explicit health states (`StorageHealth`).
- Spec 08 follow-ups: Updated action metadata sanitizer in `src/lib/storage/storage-schema.ts` to recursively purge sensitive keys from nested objects and arrays when `consentGiven` is false. Updated `BrowserDecisionRepository` `getHealth` read-only test in `src/test/storage.test.ts` to spy on `Storage.prototype.setItem` post-save and assert zero write operations during health checks.
- Spec 09: App Shell and Route Structure. Created semantic route skeleton (`/`, `/analyze`, `/activity`, `/activity/[decisionId]`, and `/help`) and persistent layout frame. Developed interactive `NavLinks` client component with responsive support for desktop sidebar (236px fixed width) and mobile top bar / bottom navigation. Added quiet persistent prototype disclosure (WCAG AA compliant color contrast) and keyboard-accessible skip-to-content routing. Implemented custom 404 (`not-found.tsx`), loading spinner (`loading.tsx`), and error boundary (`error.tsx`) components.
- Spec 10: Responsive Navigation. Implemented dedicated responsive navigation components: single typed configuration `nav-config.ts`, brand mark component `BrandMark`, 236px desktop navigation sidebar `DesktopSidebar`, mobile top bar `MobileTopBar`, and 4-column fixed mobile bottom navigation `MobileBottomNav`. Active route determination relies on Next.js `usePathname` and `isNavActive` helper, correctly highlighting active items on exact routes and nested subpaths (`/activity/[decisionId]`, `/analyze/*`). Active state visual design combines icon, label, text color, font weight, background shape/pill, and indicator border for clear non-color-only identification. Mobile touch targets maintain 44x44px min sizing, label overflow prevention at 320-360px viewports, visible focus rings, and safe-area content bottom padding clearance (`pb-[68px] min-[900px]:pb-0`).
- Spec 11: Shared UI and Form Primitives. Built 16 accessible, semantic UI components (`Button`, `IconButton`, `TextLink`, `TextField`, `AmountField`, `TextArea`, `Select`, `Checkbox`, `RadioGroup`, `SegmentedControl`, `FieldMessage`, `ErrorSummary`, `Panel`, `Divider`, `StatusBadge`, and `ProgressBar`) and small typed class-names helper (`src/lib/ui/class-names.ts`).
  - Supported Variants & Accessibility Handoff:
    - `Button` & `IconButton`: `primary`, `secondary`, `quiet`, `danger` variants; `sm`, `md`, `lg` sizes; `isLoading` spinner state with `aria-busy` preventing duplicate activation; 44x44px min target size; `IconButton` enforces accessible `label` / `aria-label` and `title` tooltip.
    - `TextLink`: `primary`, `quiet`, `danger` variants; external link indicator (`target="_blank" rel="noopener noreferrer"`); `disabled` state handling (`aria-disabled`).
    - `TextField`, `AmountField`, `TextArea`, `Select`, `Checkbox`, `RadioGroup`: Enforce visible labels (`htmlFor`/`legend`), optional required indicators (`*`), helper descriptions, error association via `aria-describedby` & `aria-invalid`, 44px min input height (`h-11`); `AmountField` includes non-interactive `₹` prefix and tabular numerals (`font-mono tabular-nums`).
    - `SegmentedControl`: Real buttons/radios in a `radiogroup` with full keyboard arrow navigation (Left/Right/Up/Down), active `aria-checked` state, and flexible grid layout avoiding horizontal overflow on 320px-360px mobile viewports.
    - `Panel` & `Divider`: `Panel` supports semantic `as` tags (`div`, `section`, `article`, `aside`) with 0-8px radius and semantic surface variants (`default`, `subtle`, `bordered`, `danger`, `warning`, `success`); `Divider` supports horizontal `<hr>` and vertical separators with optional centered text labels.
    - `StatusBadge` & `ProgressBar`: `StatusBadge` pairs visible text with decorative Lucide icons (never color alone) across `low`, `medium`, `high`, `unavailable`, `success`, `warning`, `danger`, `neutral` variants; `ProgressBar` provides native `role="progressbar"`, `aria-valuenow`, `aria-valuemin={0}`, `aria-valuemax={100}`, `aria-valuetext`, and visible percentage text.
- Quality commands and fixture naming are documented in `README.md`.

## Verified

- `npm run check`: lint (eslint), typecheck (tsc), 194 unit tests in 13 files, and production build (`next build`) passed.
- `npm run test:coverage`: passed with high coverage across domain and UI primitives.
- `git diff --check`: passed.

## Current UI

- Responsive desktop sidebar (236px width), mobile header top-bar, and 4-column fixed bottom navigation bar are fully functional with active state subpath highlighting across `/`, `/analyze`, `/activity`, `/activity/[decisionId]`, and `/help`.
- Accessible shared UI and form primitives (`Button`, `IconButton`, `TextLink`, `TextField`, `AmountField`, `TextArea`, `Select`, `Checkbox`, `RadioGroup`, `SegmentedControl`, `FieldMessage`, `ErrorSummary`, `Panel`, `Divider`, `StatusBadge`, `ProgressBar`) are fully implemented and verified.
- No editor canvas, product screens, detectors, datasets, API, or models are mounted yet.

## Next Work

1. Implement only the next approved specification and add focused tests.
2. Later phases: deterministic demo detectors, synthetic generators, FastAPI
   contracts, then classical model training/evaluation.

## Fixed Decisions

- Prototype only: no real payment, bank/police/government integration, or
  automatic complaint submission.
- Detector weights: transaction 0.45, text 0.30, graph 0.25.
- Risk bands: low <0.40, medium 0.40-0.69, high >=0.70.
- Missing signals are unavailable, never zero; use synthetic data only.
- Official reporting references: 1930 and https://cybercrime.gov.in/.

## Open Risks

- No verified genuine UPI dataset or standalone access to bank-wide graph data.
- Production thresholds, ownership, and evidence retention remain unresolved.
- `npm audit --omit=dev` (run on 2026-07-19) reports two moderate findings in Next.js 16.2.10's bundled PostCSS, as pinned in [package-lock.json](file:///c:/Users/samik/Desktop/UPI%20shield/upi_app/package-lock.json). Do not use the suggested forced downgrade to Next.js 9.3.3.
- Coverage thresholds wait until domain logic exists; WebKit is not yet
  validated.
