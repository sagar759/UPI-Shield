# AI Workflow Rules

## Approach

Build UPI Shield incrementally from the maintained context documents. Treat the
UI, APIs, models, synthetic data, explanations, and complaint workflow as one
product with clear boundaries. Implement one verifiable unit at a time and keep
the documentation synchronized.

The supplied PDF is a domain reference. These Markdown documents become the
maintained source of truth once a decision is recorded here.

## Required Sequence

1. Read project-overview.md, architecture.md, ui-context.md,
   code-standards.md, progress-tracker.md, and llmworkflow.md.
2. Identify one user flow or system contract being changed.
3. Define input, output, privacy, degraded behavior, and acceptance checks.
4. Update the relevant context when a decision changes.
5. Implement the smallest complete increment.
6. Run focused verification and then the full project checks.
7. Record completion and remaining risk in progress-tracker.md.

## Scoping

- Keep presentation, detector logic, fusion, complaint drafting, and data
  generation in separate modules.
- Do not combine unrelated refactors with a feature.
- Do not replace a detector and alter thresholds in the same step unless the
  evaluation explicitly covers both.
- Split work that cannot be explained with one focused acceptance test.

## Missing Requirements

- Resolve product ambiguity in project-overview.md.
- Resolve boundary/data ambiguity in architecture.md.
- Resolve interaction/visual ambiguity in ui-context.md.
- Record genuinely unresolved decisions in progress-tracker.md with impact.
- Use only reversible assumptions that cannot cause financial, privacy, or
  legal harm.

## AI and Model Safety

- Never claim synthetic performance proves real-world effectiveness.
- Never use target-derived or future information as a feature.
- LLM labels require human review before becoming evaluation truth.
- Never generate complete realistic personal/payment identifiers.
- Do not duplicate rows for balance; generate new controlled scenarios or use
  class weights/sampling inside training only.
- Track generator version, prompt version, seed, scenario, and review status.
- Evaluate English, Hindi transliteration, and Hinglish separately.
- Evaluate three detectors independently before fusion.
- Calibrate probabilities before combining them.
- A high score is evidence of suspected risk, not proof of crime.

## Data Workflow

1. Define point-in-time feature schema and label policy.
2. Use each public dataset only for behavior it legitimately represents.
3. Generate UPI-specific synthetic records for missing domain behavior.
4. Validate ranges, uniqueness, time order, balance, and privacy.
5. Deduplicate before splitting.
6. Split chronologically and isolate graph entities when required.
7. Fit preprocessing on training data only.
8. Save data/code fingerprints with results.

## Prompt Workflow

- Use llmworkflow.md as the versioned prompt library.
- Prompts define role, objective, schema, constraints, class mix, hard cases,
  output format, and validation checklist.
- Use deterministic code for numeric/graph records. Use an LLM mainly for
  scenario and multilingual message diversity.
- Require machine-validated structured output for generated text.
- Reject unsupported fields, invalid labels, leaked explanations, duplicates,
  or apparent personal data.
- Version prompts whenever schemas or label definitions change.

## Verification Gates

### Frontend

- Production build and automated tests pass.
- Home, three analyzers, Activity, Help, and complaint draft are usable.
- High-risk result exposes stop/report actions.
- Mobile at 360 px and desktop at 1440 px have no overlap/clipping.

### Data

- Generator runs from a clean checkout with explicit seed.
- IDs are unique, synthetic, and schema-valid.
- Fraud scenarios contain their defined causal signals.
- Normal records include hard legitimate cases.
- No exact/near duplicate crosses train, validation, and test.

### Model

- Baseline and candidate use the same point-in-time splits.
- Precision, recall, F1, PR-AUC, false-positive rate, calibration, and latency
  are reported.
- Threshold selection and subgroup/scenario errors are documented.
- Model, preprocessing, schema, and threshold share a release version.

## Protected Areas

- Do not modify third-party package contents or commit dependency directories.
- Never add real payment/chat/complaint data to synthetic folders.
- Do not change official reporting references without authoritative checking.
- Do not introduce a live bank/government integration under a demo label.

## Documentation Map

- Product scope and flow: project-overview.md.
- Architecture and policy: architecture.md.
- UI and content: ui-context.md.
- Engineering standards: code-standards.md.
- Data/model prompts and execution plan: llmworkflow.md.
- Current delivery state: progress-tracker.md.

## Completion Rule

Before moving to another unit, the current unit works end to end, respects every
architecture/privacy invariant, has passed relevant checks, is documented, and
is recorded in progress-tracker.md.
