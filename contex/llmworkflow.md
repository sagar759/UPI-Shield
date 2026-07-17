# LLM Workflow and Data Plan

## Status and Purpose

This file is a planning artifact for the three UPI Shield fraud detectors. It
contains dataset choices, data contracts, copy-ready LLM prompts, deterministic
synthetic-generation requirements, training plans, evaluation gates, and the
order in which future work should be executed.

No model is trained and no dataset is generated in the current phase.

## Critical Terminology: Synthetic, Not Duplicate

The requested duplicate data should be interpreted as synthetic data that has
the same schema and realistic behavior as the target domain. Do not duplicate
rows to increase the fraud class. Literal duplicates create leakage, encourage
memorization, distort confidence, and can appear in both train and test sets.

Use these methods instead:

- deterministic code to create new numeric transaction/account events
- controlled scenario injection for fraud and difficult legitimate behavior
- LLM-assisted language variation for English, Hindi transliteration, and
  Hinglish messages
- class weights or training-only resampling after the split
- group/time-aware deduplication and near-duplicate detection

## Three Detector Outputs

Each detector must return:

- detector name and version
- available flag
- score and confidence from 0 through 1
- stable reason codes with severity and supporting value
- processing latency
- optional model metadata and degraded-state reason

The three outputs are evaluated independently before fusion.

## Kaggle and Public Dataset Register

There is no verified, public, labeled bank-grade UPI dataset in this project.
The following sources are useful surrogates, not UPI ground truth. Recheck the
Kaggle page, license, owner, and latest version before download.

| Source | Kaggle identifier or URL | Planned use | Important limitation |
| --- | --- | --- | --- |
| PaySim | ealaxi/paysim1 | Mobile-money transaction patterns and imbalance | Not UPI; operation types differ |
| IEEE-CIS Fraud Detection | kaggle.com/competitions/ieee-fraud-detection | Tabular fraud features and validation practice | E-commerce/card context; anonymized fields |
| Credit Card Fraud Detection | mlg-ulb/creditcardfraud | Imbalance, anomaly baselines, PR-AUC | PCA card data; no user/payee semantics |
| Elliptic Data Set | ellipticco/elliptic-data-set | Graph AML/mule methodology | Bitcoin graph, not UPI or bank accounts |
| SMS Spam Collection | uciml/sms-spam-collection-dataset | Text pipeline and spam baseline | Mostly English generic spam, not Indian payment scams |

Known pages:

- https://www.kaggle.com/datasets/ealaxi/paysim1
- https://www.kaggle.com/competitions/ieee-fraud-detection/data
- https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud
- https://www.kaggle.com/datasets/ellipticco/elliptic-data-set
- https://www.kaggle.com/datasets/uciml/sms-spam-collection-dataset

Possible Kaggle CLI commands after configuring Kaggle credentials and accepting
any competition rules:

~~~powershell
kaggle datasets download -d ealaxi/paysim1
kaggle competitions download -c ieee-fraud-detection
kaggle datasets download -d mlg-ulb/creditcardfraud
kaggle datasets download -d ellipticco/elliptic-data-set
kaggle datasets download -d uciml/sms-spam-collection-dataset
~~~

Do not relabel any of these datasets as UPI data in a report or presentation.

## Dataset Intake and Governance

For every downloaded/generated dataset, create a register entry with:

- dataset name, source URL, owner, version, and download date
- license/competition terms and permitted use
- file names, row counts, schema, byte size, and SHA-256 checksum
- known population, time range, label definition, and class rate
- allowed detector use and fields explicitly excluded
- privacy review, transformation history, and reviewer

Keep raw source data immutable. Write cleaned, feature, and split outputs to
separate versioned locations. Do not commit large licensed datasets to Git.

## Planned Data Layout

~~~text
data/
  registry.yaml
  raw/              # ignored; exact downloaded archives
  interim/          # cleaned and normalized source records
  synthetic/
    transactions/
    messages/
    graph/
  processed/
    transaction/v1/
    text/v1/
    graph/v1/
  splits/v1/
  reports/
~~~

Every synthetic row includes generator_version, seed, scenario_id,
generation_method, and review_status. LLM-generated messages also include
prompt_version and batch_id.

## Split Policy

- Transaction: chronological 70/15/15 train/validation/test where possible.
- Message: group by normalized template or semantic cluster before splitting;
  preserve language/category coverage.
- Graph: train on earlier windows and evaluate later windows; isolate selected
  account communities for a cold-start test.
- Fit preprocessing, class rebalancing, calibration, and threshold selection on
  training/validation only.
- Maintain a final locked scenario test set that no prompt/model iteration sees.

## Planned Synthetic Scale

Start small enough to inspect, then scale after validation:

| Dataset | Pilot | Model-development target | Positive rate |
| --- | ---: | ---: | ---: |
| Transactions | 10,000 rows | 250,000-1,000,000 events | 2-5 percent fraud/risky |
| Scam messages | 2,000 messages | 20,000-50,000 reviewed messages | 35-50 percent scam |
| Graph edges | 25,000 edges | 500,000-2,000,000 edges | 1-3 percent mule nodes |

These are development targets, not requirements to ask an LLM to output at
once. Numeric and graph scale comes from code. Generate messages in small
batches, validate them, then continue.

## Leakage and Duplication Checks

- Exact row hashes must be unique unless a repeated real-world payment is
  intentionally modeled and linked by a repeat-pattern field.
- Normalize whitespace, case, phone/VPA masks, and punctuation before text
  near-duplicate checks.
- Cluster messages by n-gram/embedding similarity and group split clusters.
- Ensure sender/receiver IDs and timestamps themselves are not model features.
- Recompute time-window features inside each historical cutoff.
- Confirm fraud reason/scenario names are absent from model inputs.
- Compare train and test feature ranges and investigate impossible separation.

## System 1: Transaction Anomaly Detector

### Objective

Estimate whether the current payment is suspicious relative to the sender's
prior behavior and immediate context. It must distinguish an unusual amount
from a legitimately recurring high-value payment.

### Label Plan

- Primary target: is_fraud, binary, based on injected/confirmed outcome.
- Secondary analysis: fraud_type such as investment, refund_qr,
  digital_arrest, account_takeover, collect_request, or none.
- Policy-only risky examples without confirmed outcome remain review labels and
  are not silently treated as ground-truth fraud.

### Raw Synthetic Schema

- txn_id, timestamp, sender_id, receiver_id, amount, currency
- payment_type, channel, status, merchant_or_person
- device_id, location_region, note_category
- generator_version, seed, scenario_id, fraud_type, is_fraud

### Point-in-Time Feature Schema

- sender_median_amount_30d, amount_ratio, robust_amount_zscore
- is_new_payee, payee_relationship_days
- sender_txn_count_5m, 30m, 24h and sender_value_24h
- unusual_hour_score, days_since_last_txn, recent_failure_count
- device_change, location_change, collect_request, qr_context
- recurring_payment_similarity, receiver_risk_available

Do not include txn_id, raw sender/receiver/device IDs, scenario_id, fraud_type,
or generator metadata as model features.

### User Archetypes

- student: small peer/bill payments and occasional fees
- salaried adult: household, merchant, rent, and family transfers
- senior citizen: bills, family, medicine, and pension-related behavior
- small merchant: high frequency and many legitimate counterparties
- gig worker: variable incoming/outgoing value and late working hours

### Normal Hard Cases

- recurring high rent or school fee
- first payment to a legitimate verified merchant
- travel causing a location change
- festival/shopping amount spike
- emergency hospital payment
- merchant burst during peak business hours

### Fraud Injections

- large new-payee investment transfer after low-value history
- collect request presented as refund/reward
- digital-arrest verification transfer
- rapid repeated attempts after failures
- new device and location plus unusual hour
- account-takeover burst to several new receivers

### Prompt T1: Design the Transaction Detector

Use this prompt with a capable coding LLM after the repository scaffold exists.

~~~text
You are a senior fraud ML engineer designing the transaction anomaly component
of UPI Shield, an educational pre-payment risk prototype for India.

Objective:
Design a point-in-time binary classifier that estimates transaction fraud risk
before payment confirmation. It must compare the payment with the sender's own
history, avoid future-data leakage, and explain the main risk factors.

Inputs:
- the architecture and code standards in this repository
- PaySim, IEEE-CIS, and Credit Card Fraud Detection only as surrogate references
- a custom synthetic UPI-style transaction dataset

Required model progression:
1. transparent versioned rule baseline
2. Logistic Regression sanity baseline
3. class-weighted Random Forest
4. XGBoost or LightGBM only if dependency approval exists
5. optional Isolation Forest as a separate anomaly signal, not a replacement
   for supervised evaluation

Required features:
- amount ratio and robust deviation from sender baseline
- new payee and relationship age
- normal-hour deviation
- velocity counts/value at 5, 30, and 60 minute windows
- failures, inactivity, device/location change
- collect request, QR context, and recurring-payment similarity

Forbidden features:
- raw transaction, account, device, or row identifiers
- future complaints, future receiver flows, chargebacks, or final status
- scenario name, generator seed/version, or any direct label proxy

Deliverables:
- feature specification with type, source, window, default, and leakage note
- preprocessing pipeline fitted on training data only
- chronological train/validation/test split implementation
- baseline training and probability calibration
- threshold selection for low below 0.40, medium 0.40-0.69, high 0.70+
  while also reporting better data-driven alternatives
- DetectorResult output with score, confidence, reasons, latency, and version
- model card covering intended use, limitations, data, metrics, and ethics
- unit tests for feature boundaries and regression tests for five demo scenarios

Evaluation:
Report precision, recall, F1, PR-AUC, ROC-AUC for context only, false-positive
rate, Brier score/calibration plot, confusion matrix, and p95 inference latency.
Break results down by user archetype, amount band, payment type, new/known payee,
and fraud scenario. Never present accuracy alone.

Explainability:
Rules expose fired reason codes. Tree models may use SHAP or local feature
contributions internally, but convert them into stable consumer-safe reasons.
Do not accuse a receiver of fraud.

Engineering constraints:
Use typed, testable modules; deterministic seeds; no notebook-only production
logic; configuration for feature windows and thresholds; saved schema,
preprocessor, model, calibration, and threshold under one version.

Before writing code, return:
1. assumptions and unresolved questions
2. component/file plan
3. feature table and leakage audit
4. training/evaluation plan
5. acceptance checklist

Then implement only after those items are internally consistent.
~~~

### Prompt T2: Generate the Transaction Data Generator

Do not ask the LLM to print hundreds of thousands of CSV rows. Ask it to write
and test deterministic generator code with this prompt.

~~~text
Act as a synthetic financial-data engineer. Create a Python 3.11 command-line
generator for UPI-style prototype transactions. The output is artificial and
must contain no copied or realistic complete personal identifiers.

Inputs to expose:
- output directory
- random seed
- number of users and days
- target event count
- target fraud rate between 0.02 and 0.05
- start timestamp and generator version

Create stable user archetypes: student, salaried adult, senior citizen, small
merchant, and gig worker. Give each a sampled median amount, dispersion, active
hours, transaction frequency, known-payee set, device set, location region, and
recurring-payment schedule.

Generate normal events first:
- amounts from archetype-specific lognormal/gamma mixtures with rupee rounding
- weekday/hour seasonality and occasional inactivity
- mostly known payees plus plausible new legitimate merchants
- recurring rent, fee, utility, medicine, and supplier patterns
- limited failures, device changes, travel, festival spikes, and emergencies

Inject fraud as coherent sequences, not independent label flips:
- investment transfer: large amount, new payee, urgency context
- refund/collect: collect request or QR context and new receiver
- digital arrest: unusual transfer with authority/threat context reference
- account takeover: new device/location, failures, rapid multi-payee burst
- repeated payment manipulation: attempts in short windows

Preserve difficult safe cases so amount alone is not predictive. Fraud amount
distributions must overlap legitimate distributions. Device change, new payee,
and night use must occur in both classes at different rates.

Write:
- transactions.csv containing raw point-in-time events and labels
- user_profiles.csv with generator-only behavioral parameters
- scenario_manifest.csv describing injected event groups
- metadata.yaml with seed, configuration, schema, counts, rates, and version
- validation_report.json or YAML with all checks

Validation must fail on:
- duplicate txn_id or exact duplicate row
- invalid chronology, amount, category, or foreign key
- target fraud-rate deviation over configured tolerance
- a feature populated from future events
- direct label-proxy columns in the proposed model feature list
- missing required fraud or hard-normal scenario

Implement feature construction in a separate module that sorts by timestamp and
uses only prior events. Add tests proving the current event cannot enter its own
history window. Use deterministic seeds and chunked writing for scale.

Return a plan and schema first, then code, tests, and exact run commands.
~~~

### Transaction Acceptance Gate

- No duplicate rows/IDs and no personal data.
- Required archetypes and scenarios exist at planned rates.
- Fraud and safe feature distributions overlap realistically.
- All history features are point-in-time correct.
- Recurring rent stays low/medium; core fraud demos score high.
- Candidate improves PR-AUC over rules without unacceptable false positives.
- Calibrated score and latency meet the detector contract.

## System 2: Multilingual Scam Message Detector

### Objective

Classify whether a user-consented message/transcript contains social-engineering
risk and assign one or more tactic labels. It must work as a standalone check
and as an optional pre-payment signal.

### Public Data Use

SMS Spam Collection can test ingestion, text preprocessing, and a generic spam
baseline. It does not provide adequate UPI, Hinglish, digital-arrest, refund QR,
or investment-task coverage. Public spam labels must not be automatically
mapped to financial scam ground truth.

### Labels

- is_scam: binary
- tactics: urgency, fake_authority, threat, secrecy, investment_promise,
  refund_qr, credential_request, remote_access, recovery_fee
- language: en, hi_latin, hinglish
- channel: sms, whatsapp, telegram, call_transcript, social
- scenario: normal, investment, refund_qr, digital_arrest, fake_support,
  part_time_job, recovery, credential_theft

A message may have multiple tactic labels. Benign messages include difficult
uses of words such as urgent, bank, refund, QR, police, OTP, and investment.

### Record Schema

- message_id and conversation_id
- text
- is_scam and tactics
- language, channel, scenario, severity
- entities_present: amount, phone, vpa, url, bank, app
- source_type: public, template, llm_synthetic, human_authored
- prompt_version, batch_id, seed, review_status, reviewer_notes

Never include a real phone, VPA, URL, person, bank credential, PIN, or OTP.
Placeholders must be unmistakably synthetic.

### Dataset Composition

- 50-65 percent human/template-created anchors; up to 35-50 percent reviewed
  LLM variations for language diversity.
- Balance languages and key scam scenarios rather than only total classes.
- Include single messages and short multi-turn conversations.
- Include incomplete, misspelled, code-switched, polite, and indirect scams.
- Include safe customer-support, family urgency, legitimate refund notices,
  security warnings, and OTP messages that say never share.

### Prompt N1: Generate a Reviewed Message Batch

Run in batches of 50-100, change batch ID/seed, validate, and review before
requesting another batch.

~~~text
You are creating synthetic training candidates for an Indian digital-payment
scam detector. Generate exactly 100 unique examples. These are fictional safety
examples, not messages to send to real people.

Required distribution:
- 50 scam and 50 benign
- languages: roughly one-third English, one-third Hindi in Latin script, and
  one-third natural Hinglish
- channels: SMS, WhatsApp, Telegram, short call transcript, and social message
- cover every scam scenario and every tactic label defined below
- at least 20 hard benign messages that contain security-sensitive words

Allowed tactic labels only:
urgency, fake_authority, threat, secrecy, investment_promise, refund_qr,
credential_request, remote_access, recovery_fee

Scam scenarios:
digital arrest, refund QR/collect request, fake customer care, investment or
crypto promise, part-time/VIP task, credential/OTP request, remote-access app,
and recovery fee.

Hard benign scenarios:
family emergency independently verified, legitimate bank warning that says
never share OTP/PIN, real merchant refund status without a collect request,
police/public awareness message, ordinary investment discussion without a
guarantee, and known-contact recurring payment reminder.

Language requirements:
- sound like real concise Indian messaging without caricature
- include spelling variation, transliteration, and code switching
- do not make every scam obvious or use the same opening/ending
- do not translate one template word-for-word across languages

Privacy/safety constraints:
- use only obvious placeholders such as TEST_VPA_001 and TEST_PHONE_001
- URLs use example.invalid only
- OTP/PIN values use REDACTED, never plausible digits
- no real people, institutions claiming endorsement, account numbers, or
  actionable instructions that enable fraud

Output machine-valid JSONL only, one object per line, with exactly these keys:
message_id, conversation_id, text, is_scam, tactics, language, channel,
scenario, severity, entities_present, source_type, prompt_version, batch_id,
seed, review_status.

Rules:
- tactics is an array using only allowed labels
- benign tactics is normally empty; awareness messages remain benign
- review_status is pending_human_review
- source_type is llm_synthetic
- message/conversation IDs are unique and contain the batch ID
- do not include analysis, Markdown, explanations, or extra keys

Before producing output, internally check class/language/scenario counts,
duplicate phrasing, label consistency, placeholder safety, and valid JSONL.
Regenerate invalid examples rather than explaining them.
~~~

### Human Review Rubric

Each example receives accept, edit, or reject for:

- label/tactic correctness
- natural language and correct code switching
- independence from other examples
- absence of real/sensitive identifiers
- no unsafe actionable fraud instructions
- scenario realism and difficulty
- no label clue leaked through placeholder or metadata in the text

Only accepted/edited records can enter a training candidate set. A separately
reviewed human-authored test set is required; never evaluate only on LLM output.

### Prompt N2: Design and Train the Text Detector

~~~text
You are a senior multilingual NLP engineer. Design the UPI Shield scam-message
detector using reviewed English, Hindi transliteration, and Hinglish records.

Tasks:
1. validate schema, labels, privacy placeholders, and class/category counts
2. normalize Unicode/whitespace while preserving OTP, PIN, UPI, QR, amounts,
   URLs, negation, and code-switching signals
3. deduplicate exact text and cluster near duplicates before splitting
4. group split by conversation and semantic/template cluster
5. train binary scam and multi-label tactic outputs

Model progression:
- deterministic phrase/rule baseline with stable reason codes
- word and character TF-IDF plus class-weighted Logistic Regression or Linear
  SVM; calibrate if probabilities are required
- optional IndicBERT or MuRIL only after baseline quality, data size, compute,
  and latency justification

Do not remove security words as stopwords. Include character n-grams for
misspellings/transliteration. Keep message IDs, source type, prompt/batch/seed,
review status, and scenario labels out of model features.

Evaluate binary output with per-language/per-scenario precision, recall, F1,
PR-AUC, false-positive rate, calibration, and p95 latency. Evaluate tactics with
per-label and macro/micro F1 plus exact-match and label-cardinality errors.

Run robustness sets for:
- benign negation such as never share your OTP
- indirect/polite scam wording
- misspellings and punctuation removal
- code switching and short fragments
- awareness messages quoting scam phrases
- unseen paraphrases and unseen scenario templates

Return DetectorResult with detected tactic reason codes and masked entities.
Never show token weights or reproduce private text unnecessarily.

Deliver feature/preprocessing plan, split audit, baseline comparison, calibrated
thresholds, model card, error-analysis report, tests, and exact reproducible run
commands. State why any transformer is materially better before adopting it.
~~~

### Text Acceptance Gate

- No exact/near duplicate cluster crosses data splits.
- Test set includes human-authored and unseen-template examples.
- Every language and tactic has enough reviewed support to report metrics.
- Hard benign security messages control false positives.
- Reason codes match detected tactics and entities are safely masked.
- Model fits the planned latency/memory budget.
- LLM-generated-data performance is reported separately from human test data.

## System 3: Mule Account Graph Detector

### Objective

Estimate whether a receiver shows mule-like money-flow behavior using a
directed temporal graph. This is a risk signal, not a criminal determination.

### Public Data Use

The Elliptic dataset can demonstrate graph preprocessing, node classification,
temporal splitting, and AML-style neighborhoods. It represents Bitcoin
transactions, not UPI accounts. PaySim can inspire edge patterns but does not
provide a labeled UPI mule graph. Therefore UPI-specific graph behavior must be
synthetic until approved bank data is available.

### Graph Tables

accounts.csv:

- account_id, archetype, created_at, home_region
- generator_version, seed, scenario_id, is_mule

edges.csv:

- txn_id, timestamp, sender_id, receiver_id, amount
- payment_type, channel, status, scenario_id, is_fraud_edge

node_features.csv at each as_of timestamp:

- unique_senders_1h and 24h
- unique_receivers_1h and 24h
- incoming/outgoing value in 1h and 24h
- pass_through_ratio_30m and 24h
- median_holding_time_minutes
- burst_ratio, account_age_days, dormant_reactivation
- optional PageRank, in/out centrality, suspicious_neighbor_ratio, community

Model features exclude raw IDs, scenario, generator metadata, is_fraud_edge,
and all events after as_of.

### Normal Account Archetypes

- person: few trusted peers and merchants; moderate retention
- small merchant: many incoming customers but business-hour seasonality,
  supplier/tax outgoing flows, and longer retention
- marketplace seller: variable fan-in with shipment/refund patterns
- gig worker: many platform inflows and ordinary expense outflows
- family hub: repeated transfers among a stable small community

### Mule Scenarios

- fan-in collector forwarding most funds within 5-30 minutes
- fan-out distributor splitting funds across layered accounts
- chain mule moving value through A to B to C to D
- ring accounts circulating funds to obscure origin
- dormant account suddenly activated for a burst
- mixed mule using ordinary activity to camouflage suspicious windows

Hard negatives must include legitimate merchants with high fan-in and treasury
behavior, so unique sender count alone cannot determine risk.

### Prompt G1: Generate the Temporal Payment Graph

~~~text
Act as a financial crime graph-data engineer. Write a deterministic Python 3.11
generator for a synthetic directed UPI-style payment network. Generate code,
not a huge block of CSV rows.

Expose CLI parameters for output directory, seed, account count, event count,
start/end time, mule-node rate between 0.01 and 0.03, scenario mix, and version.

Build normal account archetypes first: person, small merchant, marketplace
seller, gig worker, and family hub. Generate realistic communities, stable
relationships, time-of-day/day-of-week behavior, amount distributions, and
account retention. High merchant fan-in must be common enough to be a hard
negative.

Inject coherent mule subgraphs:
- collector: many unrelated victims then rapid forwarding
- distributor: incoming consolidation then split to several accounts
- layering chain: at least four hops with short holding time
- ring: circular movement among controlled accounts
- dormant reactivation: quiet history followed by a sudden burst
- mixed mule: normal-looking activity plus suspicious windows

For pass-through behavior, link outgoing edges to prior incoming value without
copying exact amounts every time. Add operational noise, partial retention, fees,
delays, failed edges, and overlapping normal amounts. Avoid rules that make one
feature a perfect label proxy.

Write accounts.csv, edges.csv, scenario_manifest.csv, metadata.yaml, and a
validation report. Keep labels/provenance available for evaluation but separate
from model features.

Implement a point-in-time feature builder. For any account and as_of timestamp,
use only edges with timestamp earlier than as_of. Calculate windowed fan-in,
fan-out, value, pass-through, holding time, burst, age, and optional NetworkX
centrality/community features using a documented historical snapshot.

Validation must prove:
- unique IDs, valid foreign keys, positive amounts, and ordered timestamps
- every mule pattern exists and every normal archetype has enough examples
- legitimate high-fan-in merchants exist
- future edges cannot change an earlier feature row
- graph remains connected enough for analysis without becoming one unrealistic
  dense component
- configured class/scenario rates are within tolerance
- no raw ID, scenario, or label is proposed as a feature

Add tests for a known 65-sender, 92-percent pass-through, 20-minute holding-time
mule and a legitimate merchant with similar fan-in but normal retention and
stable suppliers. Return plan/schema first, then code, tests, and run commands.
~~~

### Prompt G2: Design and Evaluate the Mule Detector

~~~text
You are a senior graph-analytics engineer designing the UPI Shield mule-account
detector. The output is a probability of mule-like behavior at a receiver and
an explanation of the flow signals. It is not a legal conclusion.

Start with a transparent NetworkX feature service and a class-weighted tabular
model such as Logistic Regression or Random Forest. Do not begin with a GNN
unless you first prove that labels, graph scale, temporal snapshots, and
explanations justify it.

Build historical snapshots and enforce strict as-of timestamps. Features:
unique sender/receiver counts, incoming/outgoing value, 30-minute/24-hour
pass-through, holding-time statistics, burst ratio, account age, dormant
reactivation, centrality, suspicious-neighbor ratio, and community features.
Document every window and default.

Split by time and hold out selected communities/accounts for cold-start tests.
Do not allow the same account's future edges or target-derived edge labels into
an earlier feature row. Compare the model against simple thresholds and a
fan-in-only baseline.

Evaluate node-level precision, recall, F1, PR-AUC, false-positive rate, top-k
hit rate, calibration, and p95 feature/scoring latency. Report separately for
collectors, distributors, chains, rings, dormant reactivation, legitimate
merchants, and unseen communities.

Explanations must state observable behavior such as many unrelated senders in
24 hours, 92 percent forwarded within 20 minutes, or short holding time. Never
expose private neighbors or assert that an account is criminal.

Deliver schema, snapshot algorithm, leakage audit, baseline comparison, feature
importance/reason mapping, model card, monitoring/drift plan, tests, and exact
reproducible commands. Return assumptions and acceptance checklist before code.
~~~

### Graph Acceptance Gate

- Temporal features are point-in-time correct.
- Legitimate merchants are not rejected solely for high fan-in.
- Mule patterns are detected in both seen and held-out communities.
- Top-k review list is useful at the planned analyst capacity.
- Reason codes explain flow, time, and volume signals.
- Feature/scoring latency meets the future pre-payment budget.

## Risk Fusion and Explanation

Detector probabilities must be calibrated before fusion. The planned initial
weights are transaction 0.45, text 0.30, and graph 0.25. When a detector is
unavailable, normalize across available weights and return coverage. Do not
replace a missing score with zero.

### Prompt F1: Design the Fusion Policy

~~~text
You are a fraud decision-policy engineer. Design the UPI Shield fusion layer
around three independent calibrated DetectorResult inputs: transaction, text,
and graph.

Requirements:
- default weights: transaction 0.45, text 0.30, graph 0.25
- normalize weights across available detectors
- return coverage equal to the sum of original available weights
- low below 0.40, medium 0.40-0.69, high 0.70+
- produce review/degraded state when no detector is available, coverage is below
  0.45, or confidence is insufficient
- select two to five nonduplicate reasons ranked by severity/contribution
- map stable reason codes to consumer-safe text outside detector/model code
- include all detector, schema, calibration, threshold, and policy versions

Action policy:
- low: allow simulated flow with normal receiver verification reminder
- medium: independent verification and explicit extra confirmation
- high: recommend cancel, show reporting help, and require a separate override
  confirmation before simulated continuation

Test every missing-signal combination, exact threshold boundaries, NaN/out-of-
range inputs, detector timeout, conflicting signals, low confidence, and all
five demo scenarios. Preserve the original decision when recording an override.

Compare fixed weights with a constrained Logistic Regression/meta-model only
after an out-of-fold training design prevents leakage. Do not train the fusion
model on predictions produced from models that saw the same rows during fit.

Return the policy contract, decision table, failure behavior, tests, monitoring
metrics, and rollout plan before implementation.
~~~

## Complaint Drafting Boundary

The complaint assistant is not a fourth fraud detector. It consumes user-
reviewed transaction and incident fields after a decision. It may structure and
summarize supplied facts, but it may not invent IDs, contact police, file an FIR,
promise recovery, or declare guilt. The user reviews every output and submits it
through official channels.

## End-to-End Execution Order

### Stage 0: Approval

1. Freeze v1 schemas, label definitions, reason codes, and consent rules.
2. Create dataset register and confirm licenses/terms.
3. Approve synthetic-data distributions and hard-case scenarios.
4. Define experiment naming, random seeds, and artifact locations.

### Stage 1: Pilot Data

1. Download allowed public surrogates without modifying raw archives.
2. Generate 10,000 transactions and 25,000 graph edges with code.
3. Generate/review 2,000 multilingual messages in small batches.
4. Run schema, privacy, duplication, leakage, and distribution checks.
5. Manually inspect at least 100 records from each dataset.

### Stage 2: Transparent Baselines

1. Implement reason-coded transaction rules.
2. Implement phrase/tactic text rules.
3. Implement graph-feature thresholds.
4. Verify all five demo scenarios and difficult safe cases.

### Stage 3: Classical Models

1. Freeze point-in-time splits.
2. Train simple linear baselines.
3. Train Random Forest/XGBoost transaction candidate.
4. Train TF-IDF Logistic Regression multi-label text candidate.
5. Train tabular graph-feature candidate.
6. Calibrate probabilities on validation data only.

### Stage 4: Independent Review

1. Produce model card, data card, leakage report, and error analysis per model.
2. Review subgroup/scenario false positives and false negatives.
3. Lock one candidate version per detector.
4. Keep the locked test set untouched until the review decision.

### Stage 5: Fusion and Product

1. Integrate only versioned detector contracts.
2. Test missing/timeout/conflict behavior.
3. Run end-to-end scenario and UI tests.
4. Measure p95 latency and warning-action outcomes.

### Stage 6: Optional Advanced Work

- Test transformer NLP only if classical multilingual errors justify it.
- Test GNN only if graph labels/scale and deployment budget justify it.
- Test learned fusion only with out-of-fold predictions and governance review.

## Reproducibility Requirements

Every experiment record includes:

- experiment and Git revision
- dataset checksums, schema version, and split manifest
- generator/prompt versions and seeds
- preprocessing, feature, model, calibration, threshold, and policy versions
- dependency lockfile/environment
- full metric tables and latency environment
- artifact checksums and reviewer decision

## Prompt Q1: Audit Generated Data or a Model Plan

Use a separate LLM session as a critic, but do not treat it as the only
validator.

~~~text
Act as an independent fraud-ML reviewer. Audit the supplied schema, generator
configuration, validation report, split manifest, feature list, and metric
report for UPI Shield. Do not write new implementation code.

Check systematically:
1. schema types, ranges, keys, null policy, and provenance
2. apparent personal/sensitive data or realistic identifiers
3. exact and near duplicates, including cross-split similarity
4. future/target leakage and features unavailable before payment
5. label consistency and unrealistically perfect proxy features
6. class, language, scenario, archetype, amount, and time distributions
7. difficult legitimate cases and nontrivial fraud cases
8. split correctness for time, conversation/template groups, and graph entities
9. preprocessing/calibration/resampling fitted only on allowed data
10. precision, recall, F1, PR-AUC, false-positive rate, calibration, latency,
    subgroup errors, and baseline comparison
11. explanations matching actual signals without legal accusation
12. limitations and claims that overreach synthetic/surrogate evidence

Output:
- blocker findings that invalidate the experiment
- major findings that bias metrics or product behavior
- minor findings and documentation gaps
- evidence for each finding
- exact corrective action and recheck
- final decision: reject, revise, or ready for human review

Do not approve based on accuracy alone, plausible-looking samples, or an LLM
self-check. Say unknown when evidence is missing.
~~~

## Automated Validation Checklist

### All Datasets

- schema and enum validation passes
- primary/foreign keys and timestamps are valid
- checksums/provenance/seed/version are present
- no real personal or payment secrets are detected
- exact duplicates are absent and near duplicates are reported
- train/validation/test are reproducible and disjoint by required groups

### Transaction

- all features are computable at decision time
- amount/new-payee/night/device signals occur in both safe and fraud records
- recurring high-value payment and emergency hard negatives exist
- scenario IDs and labels cannot enter features

### Text

- structured output parses without repair
- only approved labels/languages/channels appear
- every record passed human review before approved use
- benign negation and awareness examples are present
- semantic/template clusters do not cross splits

### Graph

- edges reference valid nodes and use earlier-than-as-of features
- mule subgraphs and hard-negative merchants exist
- no future edge changes earlier feature output
- connected-component density and degree distributions are plausible

## Evaluation and Threshold Plan

Accuracy is never a release gate because fraud is rare. Report:

- precision: how many warnings were truly risky
- recall: how many risky cases were caught
- F1: balance of precision and recall
- PR-AUC: ranking quality under class imbalance
- false-positive rate and alerts per 1,000 legitimate payments
- Brier score and reliability diagram for probability calibration
- p50/p95/p99 feature and inference latency
- transaction metrics by archetype, amount, payee status, and payment type
- text metrics by language, tactic, channel, and human/LLM source
- graph top-k hit rate and metrics by mule/merchant pattern
- explanation correctness and human comprehension review

Select thresholds from validation data using an explicit cost table. A false
negative can produce financial loss; a false positive produces friction and
warning fatigue. Medium-risk warnings should use softer verification while high
risk uses strong interruption. Lock thresholds before final test evaluation.

The 0.40/0.70 policy thresholds are prototype defaults, not proven production
values. Record any detector threshold separately from the fused policy.

## Planned Command Interface

The implementation should eventually expose commands similar to:

~~~powershell
python scripts/generate_transactions.py --seed 42 --events 10000
python scripts/generate_graph.py --seed 42 --edges 25000
python scripts/validate_datasets.py --config configs/data-v1.yaml
python -m training.transaction.train --config configs/txn-v1.yaml
python -m training.text.train --config configs/text-v1.yaml
python -m training.graph.train --config configs/graph-v1.yaml
python -m training.evaluate --release candidate-v1
~~~

These are planned interfaces, not commands that currently exist.

## Model/Data Card Minimum Sections

- name, version, owner, date, approval state
- intended use and prohibited use
- source/synthetic data composition and licenses
- population, labels, splits, preprocessing, and leakage controls
- model/feature/threshold/calibration versions
- overall and subgroup metrics with uncertainty
- error analysis and known failure modes
- privacy, bias, safety, and security considerations
- latency/resource requirements
- monitoring, retraining triggers, rollback, and expiry

## Practical Synthetic-Data Procedure

1. Freeze schemas and scenario/label definitions in version control.
2. Run prompt T2 and G1 to have a coding LLM propose deterministic generators;
   review the plan before accepting code in the later build phase.
3. Unit-test generators on tiny output and manually inspect records/sequences.
4. Generate the pilot transaction/graph datasets with seed 42.
5. Create human-authored anchor messages for every language/tactic/hard negative.
6. Run prompt N1 in small versioned batches; parse automatically and review
   every record with the rubric.
7. Run schema, privacy, duplicate, temporal, distribution, and leakage checks.
8. Freeze group/time-aware splits and store their manifests/checksums.
9. Run prompt Q1 plus human technical review; correct generators rather than
   hand-editing random rows where possible.
10. Scale with new seeds only after pilot acceptance, then rerun all validation.

## Final Gate Before Any Implementation Claim

- All sources and limitations are correctly named.
- No public surrogate is described as genuine UPI data.
- No row duplication is used to inflate the minority class.
- Synthetic identifiers cannot be mistaken for real users.
- Schema, label, feature, reason-code, prompt, and policy versions align.
- Five end-to-end demo scenarios and hard legitimate cases are defined.
- Each detector has a transparent baseline, candidate plan, leakage audit, and
  independent evaluation.
- Fusion handles missing/conflicting signals and exposes coverage.
- Privacy/consent, complaint boundary, and legal language are documented.
- Production claims are deferred until representative approved data and a
  governed pilot exist.

## Known Limitations

- Public data does not reproduce the complete UPI ecosystem.
- Synthetic correlations may be easier than evolving real fraud behavior.
- LLM-created messages can contain style artifacts and labeling bias.
- A standalone app cannot observe bank-wide receiver money flows.
- Mixed-language text, voice-transcription errors, and new scam tactics require
  continuous reviewed updates.
- Thresholds that work in a classroom demo may create unacceptable production
  friction.
- A high-risk score must remain a suspected-risk warning, not an accusation.

## Presentation-Safe Summary

UPI Shield is planned as a multi-signal prototype: transaction behavior detects
an unusual payment, multilingual NLP detects social engineering, and temporal
graph features detect mule-like receiver flow. Public Kaggle datasets are used
only as methodological surrogates. UPI-specific behavior is represented with
reproducible synthetic data, strict leakage controls, human-reviewed messages,
explainable warnings, and honest limitations. The complaint assistant prepares
information for the user but does not contact or replace official authorities.
