# Phase 3 — Accounts & Users Validation Report

Status: **COMPLETE**

Phase: **3 — Accounts & Users**

---

## 1. Scope

Phase 3 establishes the account, authentication, authorization, profile, and basic account-settings foundation for Anime Platform.

Completed tasks:

- AN-036 — Accounts & Auth Architecture
- AN-037 — Prisma User + Session Model
- AN-038 — Password & Session Security Utilities
- AN-039 — GraphQL Auth Context
- AN-040 — Register Mutation
- AN-041 — Login Mutation
- AN-042 — Current User / me Query
- AN-043 — Logout + Session Revocation
- AN-044 — Authorization Baseline
- AN-045 — Register UI
- AN-046 — Login UI
- AN-047 — Auth-aware App Shell
- AN-048 — Basic Profile & Account Settings
- AN-049 — Auth Tests & Security Audit
- AN-050 — Phase 3 Validation & Documentation

---

## 2. Authentication Architecture

Authentication uses server-side opaque sessions.

The browser stores only a random session token in an HttpOnly cookie.

The database stores only the SHA-256 hash of the session token.

Passwords are hashed using Argon2id.

No authentication token is stored in localStorage or sessionStorage.

Session model:

- absolute session lifetime: 30 days
- server-side revocation
- expiration validation
- revoked sessions rejected
- expired sessions rejected

Cookie policy:

Development:

- name: `anilist_session`
- HttpOnly
- SameSite=Lax
- Path=/
- Secure=false

Production:

- name: `__Host-anilist_session`
- HttpOnly
- Secure
- SameSite=Lax
- Path=/

---

## 3. Identity Rules

Email:

- normalized with trim + lowercase
- unique
- maximum 320 characters
- database normalization constraint

Username:

- canonical lowercase
- 3–24 characters
- `[a-z0-9_]`
- unique
- database format constraint

Password:

- minimum 15 characters
- maximum 128 characters
- no composition rules

Roles:

- USER
- MODERATOR
- ADMIN

---

## 4. GraphQL Account API

Implemented operations:

### Public

- `register(input)`
- `login(input)`
- `logout`
- `userProfile(username)`

### Authenticated

- `me`
- `updateProfile(input)`

Public profile exposes only:

- id
- username
- displayName
- bio
- avatarUrl
- role
- createdAt

Public profile does not expose:

- email
- passwordHash
- sessions
- session tokens

---

## 5. Authorization

Authentication guard:

- anonymous access to protected resolvers returns `UNAUTHENTICATED`

Role guard:

- no role metadata: allowed
- anonymous access to role-protected resolver: `UNAUTHENTICATED`
- authenticated user without required role: `FORBIDDEN`
- accepted role: allowed

Profile updates derive the target user ID from the authenticated GraphQL context.

The client cannot choose another user ID when updating a profile.

---

## 6. Frontend Account Experience

Implemented pages:

- `/register`
- `/login`
- `/settings`
- `/user/[username]`

Auth-aware application shell supports:

Anonymous:

- Sign in
- Create account
- protected mobile destinations redirect to login

Authenticated:

- account avatar
- display name / username
- profile navigation
- anime-list navigation
- settings navigation
- sign out
- authenticated mobile navigation

Placeholder `/user/user` routes were removed.

---

## 7. Profile Settings

Editable:

- display name
- bio
- avatar URL

Read-only in Phase 3:

- username
- email

Input boundaries:

- display name: 80 characters
- bio: 500 characters
- avatar URL: HTTP/HTTPS URL

Direct avatar upload is deferred.

Username changes are deferred.

Email changes are deferred.

Password changes are deferred.

---

## 8. Security Controls

Implemented:

- Argon2id password hashing
- random opaque session tokens
- SHA-256 session-token hashing
- HttpOnly cookies
- Secure production cookies
- `__Host-` production cookie prefix
- SameSite=Lax
- exact trusted CORS origin
- credentialed CORS
- GraphQL CSRF prevention
- production introspection disabled
- production stack traces disabled
- global input whitelist
- unknown input rejection
- validation error values hidden
- server-side session revocation
- generic invalid-credentials errors
- public/private profile field separation
- fail-closed NODE_ENV validation

---

## 9. Automated Tests

Final Phase 3 API result:

```text
Test Suites: 9 passed, 9 total
Tests:       35 passed, 35 total
Snapshots:   0 total
```

Covered areas include:

- password hashing and verification
- malformed password hashes
- session token generation
- session token hashing
- session expiration
- cookie security
- anonymous auth context
- unknown sessions
- revoked sessions
- expired sessions
- valid sessions
- RequireAuthGuard
- RolesGuard
- registration security behavior
- login behavior
- generic invalid credentials
- session creation
- session revocation
- public-profile privacy
- username normalization
- authenticated profile updates

---

## 10. Quality Gates

Phase 3 final validation:

```text
pnpm test       PASS
pnpm typecheck  PASS
pnpm lint       PASS
pnpm build      PASS
```

Next.js production build completed successfully.

NestJS API production build completed successfully.

---

## 11. Secret Handling

Local secret files are excluded from Git.

Confirmed ignored:

- `.env`
- `apps/web/.env.local`

Only example environment files are allowed in source control.

Session tokens and password hashes must never be committed, logged, or included in documentation.

---

## 12. Deferred Production Hardening

The following are intentionally deferred and are not Phase 3 blockers:

- login/register rate limiting
- distributed rate limiting
- GraphQL query depth limits
- GraphQL query complexity limits
- advanced security headers / Helmet
- automatic expired-session cleanup
- richer session activity tracking
- audit/event logging
- MFA
- passkeys
- OAuth
- email verification
- password reset
- username change
- email change
- avatar file upload

These must be reviewed again before public production release.

---

## 13. Phase Result

Phase 3 establishes a stable authentication and user identity foundation for later anime tracking, statistics, achievements, and social functionality.

Final status:

**PHASE 3 — COMPLETE**
