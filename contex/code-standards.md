# Code Standards

## General

- Keep domain logic independent from UI and transport frameworks.
- Prefer explicit typed contracts over loose objects and magic strings.
- Fix root behavior instead of layering scoring or visual workarounds.
- Keep changes scoped to one product/system boundary.
- Add abstractions only when they remove real duplication or protect a contract.
- Demo scoring is deterministic: identical input produces identical output.
- Never put real PINs, OTPs, accounts, phones, VPAs, or evidence in fixtures.

## TypeScript

- Strict mode is required; avoid any and validate unknown external input.
- Domain scores are normalized from 0 through 1; percentages are presentation.
- Use readonly data where mutation is unnecessary.
- Reason codes are typed constants; user copy is mapped separately.
- src/lib functions are pure unless an effect is explicit in the contract.
- Reject NaN, Infinity, negative amounts, invalid dates, and empty identifiers
  before scoring.

## React

- Use function components and hooks.
- Keep state at the narrowest component that coordinates the behavior.
- Do not store values that can be safely derived during render.
- Use semantic buttons, links, labels, checkboxes, radios, and inputs.
- Icon-only buttons require accessible name and tooltip/title.
- Visible form labels are required; a placeholder is not a label.
- Keyboard focus remains visible.
- Loading, empty, degraded, success, and error states are required behavior.

## Styling

- Use the CSS variables defined in ui-context.md.
- Do not hardcode a component color when a semantic token exists.
- Card, panel, and dialog radius is 8 px or less.
- Do not nest cards or turn page sections into floating cards.
- Keep stable sizes for action icons, avatars, score rings, and navigation.
- Do not scale font size with viewport width; letter spacing remains 0.
- At 360 px, no label, button, input, or navigation item may overflow.
- Honor prefers-reduced-motion.

## Risk Engine

- A detector returns a full DetectorResult, never a bare score.
- Clamp every score/confidence to the inclusive 0 through 1 range.
- Every nonzero contribution has a stable reason code.
- Rank reasons by contribution/severity and remove near-duplicates.
- Only the fusion module applies global weights and thresholds.
- Missing detectors are unavailable, never score zero.
- Weights and thresholds live in one versioned policy object.
- User override is a new audit action and never changes the original decision.

## API and Backend

- Parse and validate before domain logic; authorize before private access.
- Use consistent response envelopes with request ID, data, and safe errors.
- Support idempotency for payment scoring and complaint-draft creation.
- Enforce strict chat/evidence size and content-type limits.
- Timeouts and partial failures return explicit degraded coverage.
- Never expose bank-wide graph details to an untrusted consumer client.

## Python and Training

- Target Python 3.11 or newer and type public functions.
- Generator seeds are explicit command-line inputs.
- Use pathlib and standard structured readers/writers, not string parsing.
- Save feature schema, preprocessing, threshold, metrics, data fingerprint, and
  model version with every model artifact.
- Never fit preprocessing, resampling, or calibration on validation/test data.
- Prefer chronological splits for transaction and temporal graph data.

## Data and Modeling

- Generated data is synthetic and pseudonymous with provenance metadata.
- Keep labels separate from features and never train on raw row/ID fields.
- Do not duplicate rows to balance classes; use class weights, sampling within
  training only, or controlled new scenario generation.
- Deduplicate before splitting so near-identical records cannot cross sets.
- Random graph-edge splits are forbidden when they leak account identity or
  future structure.
- Report precision, recall, F1, PR-AUC, false-positive rate, calibration, and
  latency; accuracy alone is not acceptance evidence.
- Evaluate by scenario, language, payment type, user archetype, and amount band.
- Synthetic performance validates the pipeline, not production effectiveness.

## Security

- Treat message and complaint data as sensitive.
- Never render user-provided HTML.
- Mask entities in logs/analytics and control export filenames/types.
- Dependencies are pinned by lockfile and reviewed before release.
- Do not reveal exact evasion-sensitive rules to unauthorized clients.

## Testing

- Unit-test detector boundaries and every reason-code rule.
- Test fusion with one, two, three, and zero available detectors.
- Keep regression fixtures for every presentation scenario.
- Test complaint output with missing fields and hostile input.
- Test keyboard operation and key responsive widths.
- Model tests include leakage, duplicate, calibration, drift, subgroup, and
  point-in-time feature checks.

## File Organization

- src/components: reusable UI and feature presentation.
- src/data: static demo data and scenarios.
- src/lib: detector, fusion, complaint, formatting, and storage logic.
- src/types: shared contracts.
- backend: future FastAPI application and services.
- training: future model pipelines and reports.
- scripts: reproducible utilities.
- data/synthetic: generated records and metadata.
- tests: automated checks by domain boundary.

## Documentation Synchronization

- Product behavior: project-overview.md.
- Boundaries, contracts, storage, policy: architecture.md.
- Visual tokens and interactions: ui-context.md.
- Engineering/test conventions: this file.
- Dataset, prompts, and model process: llmworkflow.md.
- Current delivery state: progress-tracker.md.
