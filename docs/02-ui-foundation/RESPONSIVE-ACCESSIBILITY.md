# Responsive & Accessibility Baseline

Status: **Phase 2 baseline**

## Responsive Strategy

Primary application breakpoint:

- below `1024px`: mobile application shell
- `1024px` and above: desktop application shell

Mobile:

- sticky top header
- fixed bottom navigation
- safe-area support
- content bottom padding prevents navigation overlap

Desktop:

- sticky 64px header
- translucent application background
- no bottom navigation

---

## Supported Audit Viewports

Phase 2 manual testing targets:

- 320px
- 390px
- 768px
- 1024px
- 1440px

Pages should also remain usable at 200% browser zoom.

---

## Keyboard Requirements

All interactive components must be usable without a mouse.

Baseline interactions include:

- Tab / Shift+Tab navigation
- Enter / Space activation
- Escape for dismissible overlays
- arrow-key interaction where provided by Base UI
- focus restoration after closing modal UI

A skip-to-content link is provided by AppShell.

---

## Focus

Interactive controls use explicit focus-visible rings.

The application shell includes scroll padding to reduce the chance of focused content being hidden behind sticky or fixed navigation.

Focus state should never rely on color change alone.

---

## Pointer Targets

Interactive components use sufficient visible size or invisible hit-area expansion.

Small visual controls such as Checkbox and Switch preserve compact appearance while exposing a larger interaction target.

---

## Motion

The UI uses short, restrained motion.

Users with:

`prefers-reduced-motion: reduce`

receive effectively disabled animations and transitions.

---

## Anime Card Accessibility

AnimeCard exposes one primary navigation link instead of duplicate poster and title tab stops.

Optional card actions remain independently accessible.

On mobile, actions must not depend exclusively on hover.

---

## Tabs

Large tab sets may horizontally scroll on narrow screens.

Long navigation labels must not force page-level horizontal overflow.

---

## Accessibility Scope

This document defines a Phase 2 baseline, not a claim of complete product accessibility certification.

Every future feature remains responsible for:

- semantic structure
- keyboard interaction
- focus management
- accessible labels
- contrast
- error communication
- responsive behavior