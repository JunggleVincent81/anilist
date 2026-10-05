# Product Definition v1.0

**Status:** LOCKED BASELINE  
**Phase:** 0 — Product & UX Definition  
**Scope:** Anime only

## 1. Vision

Platform ini adalah anime tracking, discovery, statistics, achievement, dan social platform yang membantu pengguna membangun dan merekam perjalanan mereka sebagai penonton anime.

Produk tidak hanya menjawab:

> Anime apa yang sudah aku tonton?

tetapi juga:

> Seperti apa perjalanan anime-ku?

## 2. Product Pillars

### Tracking
Mencatat anime, episode progress, status, score, rewatch, notes, dan history.

### Discovery
Menemukan anime berdasarkan search, genre, tag, season, year, studio, staff, popularity, score, dan recommendation.

### Identity
Profile, favorites, statistics, achievements, badge showcase, titles, dan personal anime history.

### Current Anime
Seasonal anime, airing schedule, episode countdown, dan continue watching.

### Social
Follow, activity, replies, likes, reviews, notifications, dan community.

## 3. Product Principles

- Anime first.
- Tracking first.
- Discovery harus membantu user menemukan anime baru.
- User history harus membentuk identity.
- Social tidak boleh mengalahkan fungsi tracking.
- Tidak ada unhealthy gamification.
- Achievement bersifat recognition/cosmetic, bukan pay-to-win.
- Privacy dan user control harus tersedia.
- Dark-first visual direction.
- Anime artwork menjadi sumber warna utama UI.

## 4. Explicit Non-Goals

Product bukan:

- manga tracker;
- manga database;
- manga reader;
- anime streaming atau piracy website;
- video hosting platform;
- marketplace;
- general-purpose social network;
- XP grinder;
- clone visual 1:1 AniList.

## 5. Roles

### Guest
Dapat search, discover, melihat anime detail, season, schedule, public profile, public review, dan public activity.

### User
Semua kemampuan Guest plus tracking, scoring, favorites, profile, statistics, achievements, reviews, following, activity, notification, dan challenge.

### Moderator
Menangani reports dan community moderation.

### Administrator
Mengelola anime data, users, moderators, reports, achievements, challenges, corrections, dan system configuration.

## 6. Tracking Statuses

```text
PLANNING
WATCHING
COMPLETED
PAUSED
DROPPED
REWATCHING
```

Anime list entry minimal menyimpan:

```text
status
episodeProgress
score
startedAt
completedAt
repeatCount
notes
isPrivate
createdAt
updatedAt
```

## 7. Progress Rules

```text
0 <= episodeProgress <= episodeCount
```

Jika episode count belum diketahui, progress tetap dapat bertambah.

Jika progress mencapai episode terakhir, aplikasi menawarkan untuk menandai anime sebagai Completed, tetapi tidak melakukan auto-complete tanpa konfirmasi.

Jika user memilih Completed saat progress belum penuh, aplikasi menawarkan untuk menyamakan progress dengan episode terakhir.

## 8. Scoring

Default score:

```text
1.0 – 10.0
```

Increment:

```text
0.5
```

Score optional dan dapat diberikan saat Watching maupun Completed.

Achievement berbasis jumlah rating hanya menghitung anime yang Completed dan memiliki score.

## 9. Rewatch

Completed anime dapat memulai rewatch.

```text
COMPLETED
↓
Start Rewatch
↓
REWATCHING
progress = 0
↓
finish
↓
repeatCount += 1
COMPLETED
```

History completion sebelumnya tidak dihapus.

## 10. Achievement Philosophy

Achievement harus:

- memberi recognition untuk milestone yang bermakna;
- mendorong discovery;
- merepresentasikan anime identity;
- menghindari spam dan unhealthy viewing behavior;
- tetap primarily cosmetic.

Achievement tidak memberikan premium access, feature advantage, financial reward, atau recommendation advantage.

Achievement system terdiri dari:

- Achievement
- Badge
- Challenge
- Secret Achievement
- Honor
- Legacy Badge
- Title
- Showcase

Tier progression:

```text
Bronze
Silver
Gold
Platinum
Mythic
```

Contoh families:

- Anime Journey
- Episode Voyager
- The Critic
- Across Generations
- Genre Explorer
- Studio Explorer
- Long Journey
- Second Journey

Series achievements hanya dibuat secara curated, bukan untuk semua anime.

Daily watch streak, binge rewards, dan global most-episodes-watched leaderboard tidak digunakan.

## 11. Data History Requirement

Sejak tracking pertama, sistem harus mampu menyimpan history/event yang cukup untuk evaluasi achievement:

```text
animeAddedAt
statusChangedAt
progress history
score history
startedAt
completedAt
rewatch events
```

## 12. Social Direction

Social system mencakup:

- follow;
- following activity;
- likes;
- replies;
- text activity;
- anime tracking activity;
- reviews;
- notifications.

Auto activity harus dapat dinonaktifkan user.

Social tetap secondary terhadap anime tracking.

## 13. Data Strategy

Production request tidak bergantung langsung pada third-party anime API.

```text
External Anime Source
        ↓
Provider Adapter
        ↓
Normalization
        ↓
Our PostgreSQL
        ↓
Our API
        ↓
Next.js
```

Platform mempunyai internal IDs sendiri dan menyimpan external IDs sebagai mapping.

Provider production akan dipilih setelah review licensing/terms.

AniList API tidak menjadi production database dependency.

## 14. Visual Direction

Visual direction:

> Dark cinematic editorial anime platform.

Karakter UI:

- dark background;
- muted surfaces;
- soft borders;
- generous spacing;
- large anime artwork;
- strong typography;
- minimal decorative color.

UI harus terasa calm, premium, modern, personal, dan content-focused.

## 15. MVP Definition

MVP selesai ketika user dapat:

```text
Register
Login
Discover Anime
Search Anime
Open Anime Detail
Add Anime To List
Change Status
Update Episode
Score Anime
Complete Anime
View Anime List
View Basic Profile
```

MVP berakhir pada Phase 6.

Achievement UI, social feed, reviews, advanced statistics, challenge, forum, dan complete admin CMS tidak termasuk Tracker MVP.

## 16. Development Model

Developer utama: **Tegar**

ChatGPT digunakan sebagai:

- architect;
- technical mentor;
- pair programmer;
- reviewer;
- debugger;
- research partner.

AI agent tidak digunakan untuk implementation berkelanjutan.

Vincent Assistant hanya boleh dipakai pada bootstrap awal bila diperlukan untuk install framework/dependencies dan membuat folder awal.

## 17. Final Product Statement

> Anime-only tracking and discovery platform where a user's watching history becomes a personal anime journey through statistics, achievements, identity and community.

Prioritas produk:

```text
TRACK
↓
DISCOVER
↓
UNDERSTAND
↓
ACHIEVE
↓
CONNECT
```
