# UI Context

## Experience Direction

UPI Shield will use a quiet, payment-focused interface inspired by familiar
Material payment applications. It should feel trustworthy and fast, not like a
marketing page or a cyber-security command center. White/light-neutral surfaces
support a blue primary action, green safe state, amber caution, and red high
risk. Multicolor accents appear sparingly so the UI is not one-note.

The app is independently branded. Do not display Google Pay/Google logos,
duplicate proprietary artwork, or imply integration.

## Color Tokens

| Role | CSS Variable | Value |
| --- | --- | --- |
| Page | --bg-base | #f7f9fc |
| Surface | --bg-surface | #ffffff |
| Subtle surface | --bg-subtle | #f1f5f9 |
| Primary text | --text-primary | #172033 |
| Secondary text | --text-secondary | #566074 |
| Muted text | --text-muted | #7b8496 |
| Primary | --accent-primary | #1a73e8 |
| Primary hover | --accent-primary-hover | #155fc0 |
| Cyan accent | --accent-cyan | #0f9d9a |
| Yellow accent | --accent-yellow | #f9ab00 |
| Border | --border-default | #dfe4ec |
| Strong border | --border-strong | #c8cfda |
| Success | --state-success | #137333 |
| Success surface | --state-success-bg | #e6f4ea |
| Warning | --state-warning | #9a6700 |
| Warning surface | --state-warning-bg | #fef7e0 |
| Error | --state-error | #c5221f |
| Error surface | --state-error-bg | #fce8e6 |
| Focus | --focus-ring | #8ab4f8 |

No gradient backgrounds, decorative blobs, or low-contrast tinted text.

## Typography and Shape

- UI: Inter, Google Sans fallback, Segoe UI, sans-serif.
- Technical values: SFMono-Regular, Consolas, monospace.
- Page title: 28 px desktop, 24 px mobile, weight 700.
- Section title: 18 px, weight 650-700.
- Panel title: 15-16 px, weight 650.
- Body: 14-15 px; supporting label: 12-13 px.
- Amounts/scores use tabular numerals. Letter spacing is 0.
- Small controls: 6 px radius. Cards/dialogs: maximum 8 px.
- Contact avatars/status dots may be circular.
- Prefer borders; reserve a restrained shadow for dialogs and fixed mobile nav.

## Layout

### Desktop

- Fixed 236 px left navigation.
- Main content max width near 1180 px with 28-36 px gutters.
- Home: primary payment/activity area plus a 340 px protection rail.
- Analyze: stable form and result columns without nested cards.
- Switch to mobile layout below approximately 900 px.

### Mobile

- One column with 16 px side padding.
- Compact top bar and fixed bottom navigation.
- Four-column payment-action grid with stable icon dimensions.
- Horizontal contact row with at least 64 px contact targets.
- Results stack signal bars, reasons, and actions vertically.
- Safe-area/bottom padding prevents navigation from covering content.

## Information Architecture

- Home: payment shortcuts, people, protection status, recent activity.
- Analyze: segmented Transaction, Scam message, and Receiver analyzers.
- Activity: prior demo decisions and recorded user actions.
- Help: reporting checklist, privacy, limitations, and official references.

Desktop uses icon plus text navigation. Mobile uses familiar Lucide icons and
short labels. Current location has both color and shape/background indication.

## Core Components

### Brand Mark

An original multicolor UPI Shield mark with a Lucide ShieldCheck icon. It must
not resemble a modified Google logo.

### Payment Actions

Scan and pay, Pay contact, Bank transfer, and Check UPI ID. Use familiar icons,
stable 44 px minimum targets, short labels, and tooltips where needed.

### Contacts

Circular local avatar images or initials with name and masked VPA. Selecting a
contact opens the transaction analyzer with receiver prefilled.

### Analyzer Segments

Three real buttons, a clear selected state, keyboard operation, and no mobile
overflow. Each mode preserves its own inputs while the user switches.

### Risk Status

- Low: green icon/label and calm verification reminder.
- Medium: amber icon/label and an extra verification step.
- High: red icon/label, direct stop recommendation, and reporting access.

Never rely on color alone. Include icon, label, score, and recommended action.

### Signal Breakdown

Three stable rows for transaction, message, and receiver. Each includes
availability, score, confidence, and a labeled bar. Missing displays Not
provided, never 0 percent.

### Reasons

Show two to five ranked plain-language reasons. Avoid raw feature names, SHAP
jargon, and graph-centrality terminology on consumer screens.

### Complaint Sheet

Centered modal on desktop and full-height sheet on narrow mobile. It contains
editable fields, generated preview, evidence checklist, and copy/download. It
never contains an automatic submit-to-police action.

## Interaction States

- Hover: subtle neutral/blue surface; no layout movement.
- Focus: visible 3 px ring.
- Loading: stable control dimensions and short scanning status.
- Disabled: readable lower contrast and correct cursor.
- Error: field message plus summary when submission is blocked.
- Empty activity: direct action to run a demo.
- Motion: 140-220 ms for color/opacity/small transforms; no decorative loops.
- prefers-reduced-motion disables nonessential animation.

## Content Rules

- Use Indian rupee formatting, India-friendly dates, and masked identifiers.
- State direct evidence: New receiver; Amount is 8x your usual payment.
- Avoid fear-based copy and legal conclusions.
- Always identify the experience as a prototype that does not move money.
- High risk primary action is Cancel payment. Continue is secondary and requires
  explicit confirmation.
- Official references are 1930 and https://cybercrime.gov.in/.

## Accessibility Acceptance

- Minimum interactive target is 44 by 44 px on mobile.
- Text and interactive controls meet WCAG AA contrast.
- Status includes text/icon equivalents in addition to color.
- Dialogs trap focus and restore it to their trigger.
- Results use a polite aria-live region without announcing decorative changes.
- Every chart/bar has a visible text value.
- All workflows are usable by keyboard and at 200 percent browser zoom.
