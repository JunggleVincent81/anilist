# UI Foundation

Status: **Locked — Phase 2**

## Purpose

Phase 2 establishes the reusable visual and interaction foundation for the anime platform.

This phase does not implement production product features such as authentication, anime discovery data, tracking mutations, achievements, or social functionality.

The goal is to ensure future product features are built on consistent design tokens, reusable primitives, responsive layouts, and accessible interaction patterns.

---

## Technology

Frontend UI foundation:

- Next.js 16 App Router
- React
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- Base UI primitives
- Nova style preset
- Lucide icons
- Geist Sans

The project is dark-first.

Light mode is not part of the Phase 2 scope.

---

## Visual Direction

The interface follows a dark cinematic editorial direction.

Primary characteristics:

- dark blue-black background
- restrained violet brand color
- cyan secondary accent
- muted elevated surfaces
- anime artwork as the primary visual color source
- subtle borders
- restrained shadows
- limited animation
- content-first presentation

The interface should feel calm, premium, modern, and personal rather than game-like or excessively colorful.

---

## Semantic Color Tokens

Core tokens:

| Token | Value | Purpose |
| --- | --- | --- |
| background | `#090E17` | application background |
| surface | `#101826` | cards and panels |
| surface-elevated | `#172233` | overlays and elevated UI |
| surface-hover | `#1D2B3F` | neutral interactive hover |
| foreground | `#F3F6FA` | primary text |
| muted-foreground | `#93A4B8` | secondary text |
| primary | `#6A5DE2` | primary actions and active states |
| primary-hover | `#6F63E8` | primary action hover |
| brand-accent | `#55C2FF` | informational / brand accent |
| success | `#4FD1A0` | success state |
| warning | `#F2B861` | warning state |
| destructive | `#EF7171` | destructive/error state |
| border | `#26364B` | passive borders |
| input | `#546680` | form control boundaries |
| ring | `#7C6FF2` | keyboard focus |

Components consume semantic tokens instead of hard-coded raw colors.

---

## Typography

Primary font:

`Geist Sans`

Locked scale:

| Role | Size | Line height |
| --- | ---: | ---: |
| Display | 48px | 56px |
| H1 | 36px | 44px |
| H2 | 28px | 36px |
| H3 | 22px | 30px |
| Body | 15px | 24px |
| Small | 13px | 20px |
| Caption | 12px | 18px |

Headings use restrained tracking and semibold weight.

---

## Shape and Spacing

Primary radii:

| Role | Radius |
| --- | ---: |
| Small | 6px |
| Controls | 8px |
| Cards | 12px |
| Large surfaces | 16px |

Spacing follows a 4px-based system.

Common values:

`4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64`

Main page content width:

`1440px`

Horizontal page padding:

- mobile: 16px
- tablet: 24px
- desktop: 32px

---

## Core Controls

Standardized controls include:

- Button
- Input
- Textarea
- Select
- Checkbox
- Switch

Button variants:

- default
- secondary
- outline
- ghost
- destructive
- link

Standard control heights:

- default button: 36px
- large button: 40px
- input: 40px
- select: 40px
- textarea minimum: 96px

All controls include explicit focus, disabled, invalid, and hover states.

---

## Overlay Components

Phase 2 includes:

- Dialog
- Sheet
- Dropdown Menu
- Tooltip
- Tabs

Dialogs use elevated dark surfaces with a strong modal backdrop.

Sheets are intended for mobile filters, navigation, secondary actions, and settings.

Tabs support:

- compact segmented mode
- editorial line mode

Editorial line tabs are intended for Anime Detail and Profile navigation.

---

## Feedback Components

Generic feedback primitives include:

- Avatar
- Badge
- Skeleton
- Toast
- LoadingState
- EmptyState
- ErrorState

Loading should prefer content-shaped skeletons where possible instead of page-level spinners.

Badges represent normal interface metadata and states.

Achievement badges are a separate future domain component.

---

## Layout System

Reusable layout primitives:

- AppShell
- PageContainer
- ContentSection
- SectionHeader
- ResponsiveGrid
- DesktopHeader
- MobileHeader
- MobileNavigation

Default page container:

`1440px`

Anime grid:

- mobile: 2 columns
- small: 3 columns
- tablet: 4 columns
- desktop: 5 columns
- large desktop: 6 columns

---

## Desktop Navigation

Desktop navigation is active at `lg` and above.

Primary links:

- Discover
- Seasonal
- Schedule

Utilities:

- Search
- Notifications
- Profile menu

Community is intentionally deferred until the social phase.

---

## Mobile Navigation

Mobile navigation contains:

- Home
- Discover
- My List
- Seasonal
- Profile

The mobile application uses:

- sticky top header
- fixed bottom navigation
- safe-area-aware spacing

Schedule remains available as a route but is not placed directly in the bottom navigation.

---

## Anime Card

AnimeCard is the first reusable anime-domain presentation primitive.

Responsibilities:

- poster
- title
- format
- episode count
- year
- score
- optional action slot

Poster ratio:

`2:3`

AnimeCard intentionally does not contain:

- API/provider logic
- tracking mutations
- authentication logic
- anime database assumptions

Provider-specific image handling will be introduced after the production anime data provider is selected.

---

## Accessibility Baseline

Phase 2 establishes:

- keyboard navigation
- visible focus states
- semantic HTML
- accessible names for icon-only controls
- skip-to-content navigation
- reduced-motion support
- safe mobile pointer targets
- sticky/fixed navigation offset protection
- horizontal overflow handling for long tab sets
- non-color-only interaction states

Accessibility must remain part of feature implementation rather than being deferred to a final cleanup phase.

---

## Internal UI Showcase

Development route:

`/dev/ui`

The page displays the complete Phase 2 design system and acts as a visual regression / manual QA surface during development.

It includes:

- semantic colors
- typography
- buttons
- forms
- badges
- avatars
- tabs
- dialogs
- sheets
- dropdown menus
- tooltips
- toasts
- feedback states
- AnimeCard
- loading skeletons

The `/dev/ui` route is development tooling and may be disabled or removed from production later.

---

## Deferred Work

Phase 2 intentionally does not implement:

- authentication
- real authenticated navigation
- anime provider integration
- anime search
- real discovery results
- tracking mutations
- notifications backend
- profile data
- achievements
- community features
- production image provider configuration
- light theme

These belong to later roadmap phases.