# Architecture Context

## Status

This is the proposed architecture for a future implementation. No live payment,
bank, police, or government integration exists in the current phase.

## Architecture Summary

UPI Shield is divided into a client, risk orchestrator, feature services, three
independent detectors, a fusion/policy service, an explanation service, and a
complaint-drafting service. The first prototype should run deterministic local
baselines. A later FastAPI implementation will preserve the same contracts and
replace baselines with approved, calibrated model artifacts.

The transaction, text, and graph detectors never call each other. Only the
fusion layer combines their outputs. This makes missing signals, testing,
versioning, and rollback explicit.

## Proposed Stack

| Layer | Prototype | Production Direction | Purpose |
| --- | --- | --- | --- |
| Client | React, TypeScript, Vite | React/native client | Payment and warning flows |
| Design | CSS tokens, Lucide React | Organization design system | Material-inspired UI |
| API | Local TypeScript services | FastAPI, Pydantic | Validation and orchestration |
| Transaction | Weighted rules | Calibrated RF/XGBoost plus rules | Behavioral anomaly |
| Text | Phrase baseline | TF-IDF Logistic Regression, IndicBERT/MuRIL | Scam language |
| Graph | Feature rules | NetworkX, optional GNN | Mule likelihood |
| Database | Local demo state | PostgreSQL | Decisions, aggregates, feedback |
| Evidence | None in demo | Encrypted object storage | Consented evidence |
| Registry | Version constants | MLflow/managed registry | Approval and rollback |
| Monitoring | Activity view | OpenTelemetry and metrics | Latency, drift, outcomes |

## Proposed Repository Boundaries

- src/components: presentation and accessible controls.
- src/data: demo profiles, contacts, scenarios, and static copy.
- src/lib: detector baselines, fusion, explanation, and complaint generation.
- src/types: shared domain and detector contracts.
- backend/app and backend/services: future FastAPI routes and services.
- training: feature definitions, training pipelines, and evaluation reports.
- scripts: reproducible data generators and validators.
- data/synthetic: generated demo records only; never real account/chat data.
- tests: unit, integration, contract, accessibility, and model checks.

## Decision Flow

1. Client validates required fields and consent.
2. Orchestrator creates an immutable request ID and scoring context.
3. Features use only information available before payment time.
4. Available detectors run independently with individual timeouts.
5. Fusion normalizes weights across available detectors.
6. Policy maps score, confidence, and coverage to an action.
7. Explanation service maps stable reason codes to localized copy.
8. Audit stores versions, scores, reasons, latency, and user action. Raw chat is
   excluded unless separately consented for retention.

## Common Detector Contract

Every detector returns: detector name, version, availability, score, confidence,
stable reason codes, reason severity/value, and latency in milliseconds.

Contract rules:

- Score and confidence are finite values from 0 through 1.
- Unavailable means no fabricated score; it does not mean zero risk.
- Reason codes are stable machine identifiers; display copy is separate.
- Detector/model version is mandatory for audit and rollback.
- A detector supplies evidence; only policy chooses a user action.

## Fusion and Policy

Default weights are transaction 0.45, scam text 0.30, and mule graph 0.25.
For available detector set A:

final_score = sum(weight_i * score_i) / sum(weight_i), for i in A

coverage = sum(weight_i), for i in A

- Low: score below 0.40.
- Medium: 0.40 through 0.69.
- High: 0.70 or above.
- Review: no detector, coverage below 0.45, or very low confidence.

Fixed thresholds suit the demo. Production thresholds require representative
validation data, calibration, and risk-owner approval.

## Transaction Data Contract

Raw fields include transaction ID, pseudonymous sender/receiver IDs, amount,
currency, timestamp, payment type, channel, device, region, and note.

Point-in-time features include:

- amount ratio to sender median and robust amount z-score
- new payee and relationship age
- deviation from normal active hours
- count and value in 5, 30, and 60 minute windows
- recent failures, inactivity, device change, and location change
- collect request, refund context, and optional name mismatch

Future complaints, chargebacks, labels, or later money movement are forbidden
as scoring features.

## Text Data Contract

Optional input is a user-consented message or call transcript. Normalization
keeps security tokens such as OTP, PIN, QR, UPI, amounts, bank names, and URLs.

Multi-label outputs: urgency, fake_authority, threat, secrecy,
investment_promise, refund_qr, credential_request, remote_access, and
recovery_fee.

Entity output may include masked UPI IDs/phones, amounts, URLs, bank/app names,
and transaction references. Raw text retention defaults to off.

## Graph Data Contract

The payment network is a directed temporal graph. Accounts/VPAs are pseudonymous
nodes and transfers are timestamped directed edges.

Receiver features include unique senders/receivers, incoming/outgoing value,
30-minute and 24-hour pass-through ratios, median holding time, burst ratio,
account age, and optional centrality/community features. Every graph feature is
calculated as-of the decision timestamp.

## Proposed API Surface

- POST /v1/risk/score: complete payment scoring with detectors, final risk,
  coverage, explanations, action, and versions.
- POST /v1/text/analyze: text-only scoring; retention requires consent.
- POST /v1/receivers/score: authorized receiver-flow scoring; no arbitrary
  public account lookup.
- POST /v1/complaints/draft: create an editable draft, never submit it.
- POST /v1/decisions/{decision_id}/feedback: append outcome without changing the
  original decision.
- GET /v1/demo-scenarios: return synthetic presentation scenarios.
- GET /health and /ready: separate process health from model readiness.

## Proposed Storage and Access

- PostgreSQL: pseudonymous user aggregates, payee relationships, immutable risk
  decisions, user actions, reviewed labels, and encrypted complaint metadata.
- Encrypted object storage: consented screenshots/receipts with short retention,
  deletion, malware scanning, and file limits.
- Feature cache/store: velocity, user baseline, relationship, and graph
  aggregates with tested online/offline parity.
- Prototype access: demo-only and no real identity/private data.
- Production consumer: bank/payment-app authenticated session and own records.
- Analyst: role-based least privilege with audited searches.
- Graph lookup: restricted to authorized risk services.

## Privacy and Security

- Collect minimum data and default optional retention to off.
- Tokenize identifiers using environment-specific keyed hashing.
- Mask UPI IDs, phones, and references in UI, logs, and analytics.
- Encrypt transit and storage; evidence has separate keys and retention.
- Never collect or log PIN, OTP, CVV, or authentication secrets.
- Validate request type, length, range, timestamp, and encoding.
- Future integration requires rate limits, replay protection, idempotency, and
  request signing.
- Treat 1930 and cybercrime.gov.in as references, not integrations.

## Monitoring Plan

- p50/p95/p99 total and detector latency; timeouts and errors.
- Score, confidence, coverage, and risk-band distributions.
- Cancel, verify, continue, override, and report rates.
- Reviewed precision, recall, F1, PR-AUC, false-positive rate, and calibration.
- Feature/language drift and scenario/subgroup performance.
- Model, schema, prompt, feature, and policy version changes.

Logs use request IDs and reason codes, never raw sensitive content.

## Delivery Stages

1. Documentation and prompt/data plan.
2. Responsive UI with deterministic demo detectors.
3. Synthetic generators and schema validators.
4. FastAPI service implementing documented contracts.
5. Offline baseline training and evaluation.
6. Shadow-mode evaluation on approved data.
7. Human-reviewed pilot with soft warnings.
8. Controlled rollout only after governance/security approval.

## Invariants

1. No component claims to transfer money, freeze an account, contact police, or
   file a complaint.
2. Client code never receives a bank-wide raw account graph.
3. Future information cannot enter online or training features.
4. Every decision records detector, schema, and policy versions.
5. Every medium/high result includes concrete reasons.
6. Missing signals are explicit and never converted to zero risk.
7. User copy says suspected or unusual, never criminal or guilty.
8. Raw chat/evidence is not retained without explicit consent.
9. Detector output is separated from user-facing explanation copy.
10. A detector failure cannot silently fail open; degraded coverage is visible.
