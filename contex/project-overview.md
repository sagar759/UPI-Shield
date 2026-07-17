# UPI Shield

## Overview

UPI Shield is a proposed AI-assisted fraud-prevention layer for Indian digital
payments. It is designed to assess risk immediately before a UPI payment by
combining three independent signals: transaction behavior, scam language, and
receiver mule-account behavior. The system will return a low, medium, or high
risk result with plain-language reasons. If money has already been sent, a
separate assistant will help the user prepare a structured complaint summary
for the 1930 cyber-fraud helpline and the National Cyber Crime Reporting Portal.

The planned user experience is a clean, mobile-first payment interface inspired
by familiar Google Pay and Material interaction patterns. It will be
independently branded as UPI Shield and must not imply affiliation with Google,
NPCI, a bank, police, or a government agency.

## Problem Statement

Many UPI scams are authorized push payment frauds. The victim enters a valid
UPI PIN and authorizes the payment after being manipulated through urgency,
threats, false authority, refund claims, investment promises, or remote-access
requests. PIN and OTP controls can confirm who approved a transaction, but they
cannot determine whether the user's intent was produced by social engineering.

UPI Shield addresses that gap by adding an explainable decision layer before
payment and a structured response workflow immediately after suspected fraud.

## Product Principles

1. Warn before loss, not only after a transaction is complete.
2. Explain every warning using observable facts rather than a score alone.
3. Apply proportional friction: allow, verify, or strongly interrupt according
   to risk.
4. Degrade safely when chat or bank-side graph information is unavailable.
5. Minimize data collection and require consent for sensitive chat/evidence.
6. Describe suspected risk without accusing a person or account of a crime.
7. Keep the prototype honest: it will simulate payments and reporting, not
   connect to live financial or government systems.

## Target Users

- Students and young adults exposed to job, gaming, crypto, investment, and
  Telegram task scams.
- Senior citizens exposed to digital-arrest, KYC, pension, insurance, and fake
  bank-officer scams.
- Small merchants exposed to refund QR, collect-request, fake screenshot, and
  marketplace scams.
- Bank/payment-app risk teams that need fast, explainable decisions.
- Cyber-cell analysts who benefit from clean transaction and evidence summaries.
- Academic evaluators reviewing tabular ML, NLP, graph analytics, and
  responsible-AI design in one end-to-end system.

## Goals

1. Design three independent fraud detectors and one controlled risk-fusion
   policy.
2. Design a pre-payment decision flow that can return a result within 300 ms
   p95 in a future production API.
3. Provide two to five understandable reasons for every medium/high warning.
4. Support English, Hindi transliteration, and Hinglish scam patterns.
5. Define reproducible synthetic datasets because genuine UPI bank data is
   sensitive and not publicly supplied.
6. Define a complaint-drafting workflow that assists but never automatically
   submits an FIR or cybercrime report.

## Core User Flows

### 1. Pre-Payment Protection

1. User selects a contact, UPI ID, QR/collect request, or bank transfer.
2. User enters an amount and may consent to paste the message that prompted the
   payment.
3. The system builds point-in-time transaction, text, and receiver features.
4. Each available detector returns a score, confidence, and reason codes.
5. The fusion policy calculates the final score and signal coverage.
6. The warning screen explains the important signals and recommended action.
7. The user cancels, independently verifies, or explicitly continues.

### 2. Message-Only Check

1. User pastes an SMS, WhatsApp/Telegram message, or call transcript.
2. The NLP detector identifies scam categories and extracts masked entities.
3. The interface explains detected tactics and recommends a safe next step.

### 3. Receiver Check

1. An authorized bank-side service supplies recent receiver-flow aggregates.
2. The graph detector checks fan-in, fan-out, pass-through, holding time,
   bursts, and suspicious account connections.
3. The result describes unusual flow without exposing a bank-wide graph to the
   consumer or declaring guilt.

### 4. Post-Fraud Complaint Support

1. User opens Report fraud from a warning or Help screen.
2. User reviews transaction, receiver, date, contact, and evidence fields.
3. The assistant creates an editable complaint summary and evidence checklist.
4. User personally contacts 1930, their bank, and cybercrime.gov.in.

## Planned Capabilities

### Transaction Risk Scorer

- Personal baseline: amount ratio, normal hours, known payees, typical channel.
- Velocity: attempts and value in 5, 30, and 60 minute windows.
- Context: device/location change, long inactivity, failures, collect request,
  and refund claims.
- Baseline rules followed by calibrated Random Forest/XGBoost; Isolation Forest
  will be evaluated when reliable labels are limited.

### Scam Chat Analyzer

- Multi-label categories: urgency, fake authority, threat, secrecy, investment
  promise, refund QR, credential request, remote access, and recovery fee.
- TF-IDF plus Logistic Regression baseline.
- IndicBERT or MuRIL candidate only after enough reviewed multilingual data is
  available.
- Entity extraction for masked phone numbers, UPI IDs, amounts, app names, and
  suspicious links.

### Mule Account Detector

- Directed temporal payment graph: accounts are nodes and transfers are edges.
- Windowed fan-in/fan-out, pass-through ratio, holding time, burst ratio,
  centrality, and suspicious-community features.
- NetworkX feature baseline; a GNN is future research, not an initial need.

### Explainable Warning

- Low: final score below 0.40. Permit with a normal verification reminder.
- Medium: 0.40 through 0.69. Add confirmation friction and independent
  verification guidance.
- High: 0.70 or higher. Strongly interrupt, recommend cancellation, and offer
  reporting support.
- Missing signals are marked unavailable and remaining weights are normalized.

### Complaint Assistant

- Transaction ID/UTR/RRN, amount, date/time, bank/app, and receiver details.
- Contact method, promise/threat, requested action, and realization of fraud.
- Evidence checklist and immediate safety actions.
- Editable output for manual submission only.

## Demo Scenarios

1. Student investment scam: Rs 25,000 to a new VPA after a guaranteed-profit
   Telegram message. Expected risk: high.
2. Refund QR scam: collect/QR request combined with scan-to-receive language.
   Expected risk: high.
3. Digital arrest: false police authority, threat, secrecy, and fund
   verification. Expected risk: high even with limited graph data.
4. Mule receiver: 65 senders, 92 percent rapid pass-through, short holding time.
   Expected risk: high.
5. Recurring rent: Rs 50,000 to a known monthly payee at a normal time, no scam
   language. Expected risk: low or medium, never automatically high.

## Scope

### In Scope for the Future Prototype

- Responsive React/TypeScript interface.
- Local deterministic versions of all three detectors for demonstrations.
- FastAPI contract and model-service design.
- Synthetic data generation and offline model notebooks/pipelines.
- Explainable results, activity history, and complaint drafting.
- Privacy, fairness, monitoring, testing, and evaluation plans.

### Out of Scope

- Processing or transferring real money.
- Live integration with Google Pay, NPCI, a bank, police, 1930, or NCRP.
- Declaring a receiver criminal or automatically freezing an account.
- Automatically filing an FIR or complaint.
- Production claims based only on synthetic or public surrogate data.
- Storing real PINs, OTPs, bank credentials, or unapproved evidence.

## Success Criteria

1. All five demo scenarios produce the expected risk band and concrete reasons.
2. Each result shows individual detector scores or an explicit unavailable
   state, final score, coverage, and model/policy version.
3. High-risk flows prioritize cancellation and reporting; continuing requires
   explicit confirmation.
4. The proposed UI works at 360 px mobile and common desktop widths without
   overlap or clipped controls.
5. Synthetic generators are seeded, reproducible, schema-validated, and contain
   no real personal data.
6. Model reports use precision, recall, F1, PR-AUC, false-positive rate,
   calibration, and latency rather than accuracy alone.
7. Documentation clearly distinguishes prototype evidence from production
   readiness.

## Terminology

- Authorized push payment fraud: a victim initiates a technically authorized
  payment after manipulation.
- Mule account: an account suspected of receiving and quickly forwarding fraud
  proceeds.
- Pass-through ratio: incoming value sent onward within a defined window divided
  by incoming value in that window.
- Warning fatigue: reduced user attention caused by excessive false or vague
  alerts.
- Synthetic data: artificial records designed to reproduce behavior without
  copying real people or transactions.
