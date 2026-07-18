# Progress Tracker

## Status

Phase 4 complete. Specifications 01-04 are implemented and verified. Continue
with the next approved specification after
`Specs-folder/04-domain-contracts-and-schema-versions.md`.

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
- Quality commands and fixture naming are documented in `README.md`.

## Verified

- `npm run check`: lint, typecheck, 28 unit tests in 3 files, and production
  build passed.
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
