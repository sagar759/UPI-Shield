# Progress Tracker

## Current Phase

Phase 1 - design-system foundation complete.

## Current Goal

The reusable visual foundation from `Specs-folder/01-design-system.md` is
implemented and verified. Product screens and shared components remain
intentionally unbuilt until their later specifications are approved.

## Completed

- Reviewed the supplied 21-page UPI Fraud Shield study guide.
- Defined the problem, users, scope, flows, scenarios, and success criteria.
- Defined three detector boundaries, common output contract, fusion weights,
  thresholds, missing-signal behavior, and action policy.
- Defined future API, storage, authentication, privacy, security, monitoring,
  and delivery architecture.
- Defined Material-inspired UI direction, tokens, layouts, components, content,
  warning behavior, and accessibility requirements.
- Defined engineering, data, model, testing, and AI workflow rules.
- Added the detailed three-detector llmworkflow.md with Kaggle surrogate data,
  synthetic-generation prompts, training/evaluation plans, and acceptance gates.
- Completed a cross-document review of status, thresholds, weights, privacy,
  implementation claims, Markdown structure, placeholders, and encoding.
- Implemented the UPI Shield semantic design tokens, Tailwind CSS 4 theme
  aliases, global reset/defaults, focus treatment, reduced-motion behavior, and
  shared typography/accessibility utilities.
- Replaced the starter font and metadata setup with Inter through `next/font`,
  India-specific document language, and prototype-safe UPI Shield metadata.
- Verified the design-system unit with `npm run lint`, `npx tsc --noEmit`,
  `npm run build`, `git diff --check`, and a semantic color-token contrast audit (updated `--text-muted` to `#687181` to satisfy WCAG AA 4.5:1 contrast requirements).

## In Progress

- None. Awaiting approval for the next implementation specification.

## Next Phase

1. Continue with the next approved implementation specification.
2. Implement deterministic demo detectors and scenarios in their planned phase.
3. Implement seeded synthetic-data generators and validators.
4. Implement FastAPI contracts and service boundaries.
5. Train and compare the three detector baselines.

## Design System Handoff

- Canonical colors: `--bg-base`, `--bg-surface`, `--bg-subtle`,
  `--text-primary`, `--text-secondary`, `--text-muted`, `--accent-primary`,
  `--accent-primary-hover`, `--accent-cyan`, `--accent-yellow`,
  `--border-default`, `--border-strong`, `--state-success`,
  `--state-success-bg`, `--state-warning`, `--state-warning-bg`,
  `--state-error`, `--state-error-bg`, and `--focus-ring`.
- Foundation namespaces: `--font-family-*`, `--type-*`, `--space-*`,
  `--layout-*`, `--border-width-*`, `--shape-radius-*`, `--elevation-*`,
  `--control-size-*`, `--icon-size-*`, `--avatar-size-*`, `--focus-*`,
  `--motion-*`, and `--layer-*`.
- Risk combinations: `--risk-low-*`, `--risk-medium-*`, `--risk-high-*`,
  `--risk-unavailable-*`, and `--risk-neutral-*`, each with text, icon,
  surface, and border roles.
- Tailwind aliases use semantic `--color-*`, `--font-*`, `--text-*`,
  `--radius-*`, `--shadow-*`, `--spacing-*`, motion, breakpoint, and layer
  theme values. Default raw color, font, radius, and shadow namespaces are
  cleared so later components use the approved roles.
- Shared utilities: `.numeric-tabular`, `.font-technical`, and
  `.visually-hidden`.
- Approved deviations from `ui-context.md`: none.

## Open Questions

- Production owner: bank, payment app, or standalone companion.
- Final thresholds/action policy require representative approved data.
- Complaint evidence retention requires legal and organization review.
- No verified genuine UPI bank transaction dataset is supplied; public data is
  surrogate and must not be described as UPI ground truth.
- Bank-side receiver graph access is unavailable to a standalone prototype.

## Architecture Decisions

- Planned client: Next.js with Inter through next/font, India-specific document language, and prototype-safe UPI Shield metadata.
- Planned API: FastAPI and Pydantic.
- Detectors remain independent and fuse through one versioned policy.
- Initial models: transparent rules, Random Forest/XGBoost transaction model,
  TF-IDF Logistic Regression text model, and NetworkX graph features.
- Numeric/graph synthetic data will be code-generated; LLM use focuses on
  multilingual text/scenario diversity.
- Prototype performs no real payment or automatic external report.

## Resume Notes

- Source: UPI_Fraud_Shield_End_to_End_Study_Guide.pdf.
- Weights: transaction 0.45, text 0.30, graph 0.25.
- Thresholds: low below 0.40, medium 0.40-0.69, high 0.70 or higher.
- Required demos: investment, refund QR, digital arrest, mule, recurring rent.
- Reporting references: 1930 and https://cybercrime.gov.in/.
