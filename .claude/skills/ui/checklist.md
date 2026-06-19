# UI Accessibility and Token Checklist

Loaded by /ui during Phase 5. Work through each section. Items marked **required** must pass before the skill is complete. Best-effort items should be completed where scope allows.

---

## Keyboard navigation (required)

- [ ] All interactive elements reachable via `Tab` in logical document order
- [ ] `Enter` activates buttons and links
- [ ] `Space` activates buttons, checkboxes, and radio buttons
- [ ] `Escape` closes modals, drawers, dropdowns, and tooltips
- [ ] Arrow keys navigate within composite widgets (tabs, listboxes, menus, radio groups)
- [ ] No keyboard trap except inside modal/dialog — where a trap is required
- [ ] After an action removes the focused element, focus moves to a logical next target (not lost to `<body>`)

## Focus visibility (required)

- [ ] Every focusable element has a visible focus indicator in all states
- [ ] `outline: none` or `outline: 0` is never present without a custom focus style replacing it
- [ ] Focus ring is visually distinct — minimum 2px width, minimum 3:1 contrast against adjacent colour

## Semantic HTML (required)

- [ ] Headings (`h1`–`h6`) reflect document hierarchy — not chosen for visual size
- [ ] `<button>` for all actions; `<a>` for all navigation — never `<div onClick>` or `<span onClick>`
- [ ] Lists use `<ul>` / `<ol>` / `<li>` — not styled divs
- [ ] Tables use `<table>`, `<thead>`, `<th scope>`, `<td>`, `<caption>` — not grid divs
- [ ] Forms group related fields with `<fieldset>` and `<legend>`
- [ ] `<main>`, `<nav>`, `<header>`, `<footer>`, `<aside>` used for landmark regions

## Labels and accessible names (required)

- [ ] Every `<input>`, `<select>`, `<textarea>` has a `<label>` associated via `for`/`id` or wrapping
- [ ] Placeholder text is not the only label — placeholder disappears on input
- [ ] Icon-only buttons have `aria-label` describing the action (e.g. `aria-label="Close"`)
- [ ] Non-decorative images have `alt` text describing content (not filename, not "image of")
- [ ] Decorative images have `alt=""` and no `aria-label`
- [ ] Linked images: `alt` describes the destination, not the image appearance

## ARIA (use only when HTML semantics are insufficient)

- [ ] `role` attribute only on genuinely custom widgets (custom dropdown, custom slider, custom tabs)
- [ ] `aria-expanded` on toggle triggers (accordion headers, dropdown triggers, disclosure buttons)
- [ ] `aria-controls` links a trigger to the element it controls (where supported)
- [ ] `aria-haspopup` on triggers that open a menu or listbox
- [ ] `aria-live="polite"` on regions that update dynamically without user action
- [ ] `aria-atomic="true"` on live regions that should be read as a whole unit
- [ ] `aria-hidden="true"` on decorative icons and elements that duplicate visible text
- [ ] `aria-disabled="true"` on custom elements that behave as disabled but can't use `disabled` attribute
- [ ] `aria-required="true"` on required form fields (in addition to visual indicator)
- [ ] `aria-invalid="true"` on fields that have failed validation, with `aria-describedby` pointing to the error message

## Colour contrast (required)

- [ ] Normal text (< 18pt / < 14pt bold): contrast ratio ≥ 4.5:1 against background
- [ ] Large text (≥ 18pt / ≥ 14pt bold): contrast ratio ≥ 3:1 against background
- [ ] UI component boundaries (input borders, button outlines, focus rings): ≥ 3:1 against adjacent colours
- [ ] Placeholder text: technically exempt but aim for ≥ 4.5:1 for usability
- [ ] Information is never conveyed by colour alone — always paired with text, icon, or pattern

## Modal and dialog (required when applicable)

- [ ] Modal has `role="dialog"` and `aria-modal="true"`
- [ ] `aria-labelledby` points to the modal's visible title element
- [ ] `aria-describedby` points to descriptive content if present
- [ ] Focus moves into the modal when it opens — to the first focusable element or the dialog element itself
- [ ] Focus is trapped inside while open — `Tab` and `Shift+Tab` cycle within the modal
- [ ] `Escape` closes the modal
- [ ] Focus returns to the trigger element that opened the modal on close

## Token discipline (required)

- [ ] No hex colour literals (`#fff`, `#1a2b3c`) in new files
- [ ] No rgb / hsl colour functions with raw values
- [ ] No raw pixel values for spacing, padding, margin, or gap (exception: `1px`, `0`)
- [ ] No raw pixel values for font sizes or line heights
- [ ] No raw pixel or rem values for border-radius or box-shadow
- [ ] All values reference the design system (Tailwind classes, CSS custom properties, design tokens)
- [ ] Missing tokens are documented as `// TODO: missing token — <what's needed>` not invented inline

## Responsive (best-effort verification)

- [ ] No horizontal scroll at 375px viewport width
- [ ] Touch targets ≥ 44×44px at mobile viewport
- [ ] Body copy ≥ 16px (1rem) at mobile viewport
- [ ] Images do not overflow their container
- [ ] Table or data-heavy content has a mobile strategy (horizontal scroll with overflow, card layout, etc.)

## Loading and error states (required)

- [ ] Loading state is implemented — no blank space while data loads
- [ ] Error state is implemented — message is visible and actionable
- [ ] Empty state is implemented — message explains why and what to do
- [ ] States are visually distinct from each other and from the populated state
