# UPI Shield Accessibility & Responsive Manual Checklist

This manual checklist MUST be referenced during every feature implementation and pull request acceptance pass to verify WCAG 2.1 AA / WCAG 2.2 AA compliance and layout invariants across viewports.

---

## 1. Screen Reader Announcements & Live Regions

- [ ] **Polite Status Updates**: Live region context (`LiveRegionProvider` / `useLiveAnnouncer`) polite announcements (`aria-live="polite"`) trigger screen reader voice output without interrupting ongoing speech when signal breakdowns or storage updates change.
- [ ] **Assertive High-Risk Alerts**: Critical warnings (such as High Risk scoring results or error states) use assertive announcements (`aria-live="assertive"` / `role="alert"`).
 [ ] **Dialog Overlay Traps & Focus Restoration**: When a modal or confirmation sheet opens, initial focus is trapped inside the dialog. When dismissal is permitted, `Escape` or the close action closes it and restores focus to the triggering element. Dialogs configured to prevent dismissal keep focus trapped and expose an explicit completion action.
- [ ] **Landmark Order**: Screen readers can navigate between `<header>`, `<aside>`, `<nav>`, `<main id="main-content">`, and `<footer>` / disclosure landmarks in logical order.

---

## 2. Keyboard Navigation & Focus Visibility

- [ ] **Skip Link**: Pressing `Tab` as the first action after page load focuses the "Skip to content" link (`a[href="#main-content"]`), rendering it visually with high contrast (`#172033` on `#ffffff`) and clear focus ring (`--focus-ring`). Activating it moves focus directly to `<main id="main-content">`.
- [ ] **Tab Order**: Every interactive element (`<button>`, `<a>`, `<input>`, `<select>`, `<textarea>`) is reachable via `Tab` / `Shift+Tab` in DOM visual reading order.
- [ ] **Focus Rings**: A 3px focus ring (`--focus-ring`: `#8ab4f8`) with keyline outline is clearly visible on every focused control. No focused element hides its focus outline.

---

## 3. Browser Zoom & Text Resizing (200%)

- [ ] **200% Zoom Integrity**: At 200% browser zoom (or 200% text size), no text truncates illegibly, overlaps adjacent containers, or causes horizontal scrolling.
- [ ] **Control Scalability**: Buttons, form fields, and dropdowns scale gracefully without clipping labels or icons.

---

## 4. Forced Colors & High Contrast Mode

- [ ] **Windows High Contrast Mode**: With `forced-colors: active` enabled, all borders, focus indicators, and active states fall back to system `CanvasText` / `Highlight` outlines without relying on CSS color variables alone.
 [ ] **Text & Control Contrast**: Text maintains WCAG AA contrast (minimum 4.5:1 for normal text, 3:1 for large text); control boundaries and focus indicators maintain at least 3:1 contrast.

---

## 5. Motion & Reduced Motion Preferences

- [ ] **Reduced Motion (`prefers-reduced-motion: reduce`)**: When reduced motion is requested, non-essential animations (spinning indicators, modal slide-ins, tab transitions) are disabled or rendered instantaneously.
- [ ] **No Decorative Animation Loops**: Spinner animations use standard 140-220ms durations without decorative infinite loops that distract low-vision or neurodivergent users.

---

## 6. Touch Target Sizing & Responsive Layouts

- [ ] **Mobile Touch Targets**: On viewports down to 360x800px, all touchable controls (`<button>`, `<a>`, segmented items, nav items) have a minimum bounding box of 44x44px.
- [ ] **No Horizontal Overflow**: No page shell or content component creates horizontal scrollbars (`scrollWidth <= clientWidth`) on mobile (360px) or desktop (1440px).
- [ ] **Fixed Navigation Clearance**: Fixed bottom navigation bar (`h-[60px]` with safe bottom padding) never obscures form submit buttons or card actions.

---

## 7. Color-Independent Status Presentation

- [ ] **Status Identifiers**: Risk badges, status dots, and warning banners use text labels and Lucide icons alongside background colors (e.g., green + check icon + "Low Risk", amber + alert icon + "Medium Risk", red + stop icon + "High Risk"). Never use color as the sole indicator of risk status.
