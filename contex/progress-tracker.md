# Progress Tracker

## Status

Phase 6 complete. Specifications 01-06 are implemented and verified. Continue with the next approved specification after `Specs-folder/06-formatting-masking-and-input-validation.md`.

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
- Quality commands and fixture naming are documented in `README.md`.

## Verified

- `npm run check`: lint, typecheck, 110 unit tests in 9 files, and production build passed.
- `npm run test:coverage` passed.
- `npm run test:e2e`: desktop and mobile smoke/accessibility tests passed.
- `git diff --check` passed.

## Current UI

- The root route still shows only the `UPI Fraud Shield` placeholder.
- Navbar/sidebar/dialog primitives exist but are not mounted into an editor
  page. No editor canvas, product screens, detectors, datasets, API, or models
  are implemented yet.

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
