# Locked Product Decisions

## D-001 — Anime Only

**Status:** LOCKED

Product hanya berfokus pada anime.

Manga dan seluruh feature terkait manga tidak masuk scope.

## D-002 — Tracking Is the Core

**Status:** LOCKED

Tracking merupakan fondasi product. Discovery, statistics, achievements, dan social dibangun di atas tracking.

## D-003 — Tracking Statuses

**Status:** LOCKED

```text
PLANNING
WATCHING
COMPLETED
PAUSED
DROPPED
REWATCHING
```

## D-004 — Score

**Status:** LOCKED

Score menggunakan skala 1.0–10.0 dengan increment 0.5.

## D-005 — No Forced Auto-Completion

**Status:** LOCKED

Mencapai final episode hanya memunculkan prompt untuk Complete, bukan mengubah status secara otomatis tanpa konfirmasi.

## D-006 — Achievements Are Cosmetic Recognition

**Status:** LOCKED

Achievement tidak memberikan feature advantage, premium access, uang, atau recommendation advantage.

## D-007 — No Unhealthy Gamification

**Status:** LOCKED

Tidak ada daily watch streak, binge reward, atau global leaderboard berdasarkan jumlah episode.

## D-008 — Achievement Identity

**Status:** LOCKED

Achievement menjadi representasi perjalanan anime user melalui badge, rarity, titles, secret achievements, dan showcase.

## D-009 — Social Is Secondary

**Status:** LOCKED

Social mendukung anime experience dan tidak menggantikan tracking/discovery sebagai fokus utama.

## D-010 — Internal Data Ownership

**Status:** LOCKED

Application menggunakan database internal sendiri.

Third-party source masuk melalui provider adapter dan normalization layer.

## D-011 — AniList API

**Status:** LOCKED

AniList API tidak menjadi production database dependency.

## D-012 — Visual Direction

**Status:** LOCKED

Dark cinematic editorial anime platform.

Tidak menyalin visual AniList 1:1.

## D-013 — Tracker MVP Boundary

**Status:** LOCKED

Tracker MVP selesai di akhir Phase 6.

## D-014 — Development Workflow

**Status:** LOCKED

Project dikerjakan manual oleh user dengan ChatGPT sebagai architect/mentor/reviewer.

AI agent tidak dipakai untuk implementation berkelanjutan.

## Deferred Technical Decisions

Keputusan berikut sengaja belum di-lock:

- final product name;
- logo;
- exact color tokens;
- exact typography;
- exact database schema;
- exact GraphQL schema;
- exact anime data provider;
- hosting;
- deployment infrastructure;
- recommendation algorithm;
- initial achievement catalog lengkap.
