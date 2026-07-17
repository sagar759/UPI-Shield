# Progress Tracker

## Current Phase

Phase 0 - system planning and design complete.

## Current Goal

Preserve the approved planning baseline until the user starts the implementation
phase. No application, dataset, or model has been built in this phase.

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

## In Progress

- None. Waiting for explicit approval to begin a future build phase.

## Next Phase (Not Started)

1. Scaffold React/TypeScript UI.
2. Implement deterministic demo detectors and scenarios.
3. Implement seeded synthetic-data generators and validators.
4. Implement FastAPI contracts and service boundaries.
5. Train and compare the three detector baselines.
6. Add fusion, explanations, complaint drafting, tests, and monitoring.

## Open Questions

- Production owner: bank, payment app, or standalone companion.
- Final thresholds/action policy require representative approved data.
- Complaint evidence retention requires legal and organization review.
- No verified genuine UPI bank transaction dataset is supplied; public data is
  surrogate and must not be described as UPI ground truth.
- Bank-side receiver graph access is unavailable to a standalone prototype.

## Architecture Decisions

- Planned client: React, TypeScript, and Vite.
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
