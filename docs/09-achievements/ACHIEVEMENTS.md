# Achievement System

## Phase
Phase 09 — Achievements & Gratification

## Purpose
The achievement system turns existing anime activity into permanent milestones
without XP, levels, currency, streak farming, or artificial grind.

## Product Principles
- achievements are milestones, not currency;
- no XP or account level;
- no daily streak requirement;
- no rarity economy;
- unlock history is permanent;
- progress is derived from canonical user data;
- public reads do not mutate achievement state;
- profile presentation is optional and user-controlled.

## Domain
`Achievement` defines catalog milestones. `UserAchievement` stores historical
user unlocks. Unlocks are never revoked if current metrics later decrease.

Categories:
`JOURNEY`, `COMPLETION`, `EPISODES`, `RATING`, `REWATCH`, `FAVORITES`, `GENRE`.

Metrics:
`TRACKED_ANIME`, `COMPLETED_ANIME`, `EPISODES_LOGGED`, `SCORED_ANIME`,
`REWATCHES`, `FAVORITE_ANIME`, `GENRE_ANIME`.

## Initial Catalog
Phase 9 ships 17 milestones:

### Journey
- FIRST_STEP — 1 tracked anime
- ON_THE_LIST — 10
- COLLECTOR — 50
- ARCHIVIST — 100

### Completion
- FIRST_FINISH — 1 completed anime
- SEASONED_VIEWER — 10
- DEDICATED_VIEWER — 50
- CENTURY_CLUB — 100

### Episodes
- HUNDRED_EPISODES — 100 episodes
- LONG_JOURNEY — 500
- THOUSAND_EPISODES — 1000

### Rating
- FIRST_RATING — 1 scored anime
- CRITIC_IN_TRAINING — 25

### Rewatch
- ENCORE — 1 rewatch
- AGAIN_AND_AGAIN — 10

### Favorites
- CURATOR — 5 favorite anime
- PERSONAL_SHELF — 20

## Title Rewards
Selected achievements reward titles:
`Archivist`, `Dedicated Viewer`, `Century Viewer`, `Episode Voyager`,
`Critic`, `Rewatcher`, `Curator`.

Only one unlocked title may be equipped at a time.

## Profile Showcase
A user can showcase at most three unlocked achievements in positions 1–3.
Removing or replacing a showcase slot does not affect unlock history.

## Evaluation
The evaluator derives metrics from tracking, completion, episode progress,
scores, rewatches, favorites, and tracked genres. It compares active catalog
thresholds with current metrics and inserts only newly satisfied unlocks.

## Reconciliation
Automatic reconciliation runs after relevant growth mutations such as tracking
upsert and favorite add. It is best-effort: failure does not invalidate the
primary tracking/favorite mutation.

Authenticated users can repair/backfill with:

```graphql
reconcileMyAchievements
```

## GraphQL API
Public:
```graphql
userAchievements(username: String!)
```

Authenticated:
```graphql
myAchievements
reconcileMyAchievements
setAchievementShowcase(achievementId: ID!, position: Int)
equipAchievementTitle(achievementId: ID)
```

## Frontend
Public route:
```text
/user/[username]/achievements
```

The page includes total progress, unlocked count, equipped title, showcase,
grouped milestones, locked/unlocked state, progress, loading, and error states.

Profile owners can assign/remove showcase slots and equip/unequip titles.
Public profiles display the equipped title and up to three showcased milestones.

## Persisted vs Derived
Persisted:
- achievement definitions;
- unlock history and unlockedAt;
- showcase positions;
- equipped title achievement.

Derived:
- current metric values;
- progress and progress percentage;
- current eligibility for locked achievements.

## Deferred
- rarity;
- secret achievements;
- XP and levels;
- currencies;
- daily streak rewards;
- leaderboards;
- social achievement activity;
- achievement notifications.
