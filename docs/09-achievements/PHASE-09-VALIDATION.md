# Phase 09 Validation

**Phase:** 09 — Achievements & Gratification  
**Status:** COMPLETE  
**Validation date:** 2026-10-08

## Scope
Validated:
- Prisma achievement domain and constraints;
- catalog synchronization;
- evaluator and permanent unlock semantics;
- automatic/manual reconciliation;
- GraphQL achievement API;
- showcase/title rules;
- frontend contract and achievement page;
- owner controls and public profile integration;
- tracking/favorites/statistics regression;
- Base UI composition regressions.

## Migrations
```text
20261007181032_add_achievement_domain
20261007181200_add_achievement_constraints
```

Constraints include:
```text
threshold > 0
sortOrder >= 0
showcasePosition IS NULL OR showcasePosition BETWEEN 1 AND 3
```

## Invariants
- unlock history is permanent;
- only unlocked achievements may be showcased;
- showcase positions are 1–3;
- title source achievement must be unlocked and provide `titleReward`;
- one title may be equipped;
- public reads are side-effect free.

## Reconciliation
Relevant growth mutations trigger best-effort reconciliation. Manual
reconciliation remains available for repair/backfill.

## Frontend Regression
Routes:
```text
/user/[username]
/user/[username]/anime-list
/user/[username]/favorites
/user/[username]/statistics
/user/[username]/achievements
```

Phase 9 also fixed:
- `DropdownMenuLabel` placement inside `DropdownMenuGroup`;
- Link-rendered Base UI buttons with `nativeButton={false}`;
- profile navigation route regression.

## Final Gate
```text
pnpm --filter @anime-platform/api exec prisma migrate status
pnpm --filter @anime-platform/api test
pnpm typecheck
pnpm lint
pnpm --filter @anime-platform/api build
pnpm --filter @anime-platform/web build
git diff --check
```

## Result
Phase 9 establishes persistent achievement history, progress, profile showcase,
and unlockable titles without XP/grind mechanics.
