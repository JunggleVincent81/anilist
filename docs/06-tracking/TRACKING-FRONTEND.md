# Phase 6 — Tracking Frontend

## Anime detail integration

Anime detail pages now expose a tracking control in the detail hero.

The control supports:

- unauthenticated sign-in prompt
- add to list
- status editing
- episode progress editing
- score editing
- remove from list
- loading state
- error state with retry
- mutation loading protection
- success/error toast feedback

The control is a Client Component because authenticated GraphQL requests rely on the browser session cookie.

## Public user anime list

Route:

`/user/[username]/anime-list`

The list is public and server-rendered.

It supports status filters, pagination, entry cards, progress, score, rewatch count, empty state, loading UI, route-level error UI, and responsive layouts.

## Owner editing

When the list belongs to the currently authenticated user, owner-only inline editing is enabled.

Public lists belonging to other users remain read-only.

After a mutation, the list refreshes server data so filtered lists and pagination stay consistent with backend state.

## Navigation integration

Desktop and mobile My List navigation use the authenticated user's actual username.

Profile Anime List links use the profile's username.

There are no hardcoded `/user/user` or fixed `/anime-list` identity routes in the Phase 6 navigation flow.
