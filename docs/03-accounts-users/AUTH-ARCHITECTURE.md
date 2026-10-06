# Authentication Architecture

Status: **Phase 3 — Locked baseline**

## Goal

Provide secure account authentication and session management for the anime platform before user-dependent product features are introduced.

## Authentication Model

The application uses server-side opaque sessions.

Authentication credentials are never stored in browser localStorage or sessionStorage.

The browser stores only a random session token in an HttpOnly cookie.

The database stores only a cryptographic hash of that session token.

## Session Lifecycle

Login or registration:

1. Validate credentials.
2. Create or authenticate the user.
3. Generate a cryptographically secure random session token.
4. Hash the token.
5. Store the hashed token in PostgreSQL.
6. Send the raw token only through an HttpOnly cookie.

Authenticated request:

1. Read the session cookie.
2. Hash the token.
3. Look up the Session record.
4. Reject expired or revoked sessions.
5. Load the related User.
6. Attach the authenticated user to GraphQL context.

Logout:

1. Identify the current session.
2. Revoke or delete the server-side session.
3. Clear the session cookie.

## Password Storage

Passwords are hashed using Argon2id.

Plain-text passwords are never stored or logged.

## Password Policy

Phase 3 baseline:

- minimum length: 15 characters
- maximum length: 128 characters
- no mandatory uppercase/lowercase/number/symbol composition rules
- spaces and passphrases are allowed

## User Identity

Email:

- normalized before persistence
- unique
- used for authentication

Username:

- 3–24 characters
- lowercase
- letters, numbers, and underscore only
- unique
- used for public profile URLs

## Roles

Supported baseline roles:

- USER
- MODERATOR
- ADMIN

Authorization must always be enforced server-side.

## Cookie Policy

Session cookies:

- HttpOnly
- Path=/
- SameSite=Lax by default
- Secure in production
- not readable by client JavaScript

## Session Security

Sessions must:

- use cryptographically random tokens
- be invalidated server-side on logout
- expire server-side
- never expose raw token values in logs
- store only token hashes in PostgreSQL

## GraphQL

GraphQL context resolves the current session and exposes the authenticated user to resolvers.

Public resolvers may execute without a session.

Protected resolvers require an authenticated user.

Role-restricted resolvers require explicit authorization.

## Deferred

Phase 3 does not initially include:

- OAuth/social login
- MFA
- passkeys
- email verification delivery
- passwordless authentication
- device management UI
- admin user management UI

The architecture should not prevent these from being added later.