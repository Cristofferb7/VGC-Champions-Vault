# Sprint 9 — Home becomes a dashboard (fill the gap with data, not padding)

Sprint 8 accepted: APK workflow green (4 MB artifact, OCR assets runtime-fetched — good call), share intent reuses the existing flow, web smoke clean, and all four anomalies were sound judgment (JDK 21, kotlin-bom, anchored `.vercelignore`, Node-22 note). Share-sheet verification remains on the user's Android device.

User feedback (desktop screenshot, 2026-07-11): there's still a visible empty band between YOUR ROSTERS and the bottom nav on tall viewports. Decision made with the user: **grow the roster cards modestly AND fill the remaining space with a data module** — not padding, not oversized cards.

## 1. Roster cards: modest growth

- Bump card height to ~220px so the 3×2 sprite grid breathes (sprites ~56px), keep the card+peek carousel behavior from Sprint 7 untouched.
- Cards should not grow past their current width; the point is proportion, not filling space with size.

## 2. New: "Meta Pulse" section under YOUR ROSTERS

A compact, glanceable strip that makes Home the app's dashboard:

- **Content (all from the already-cached snapshots — zero new fetches):** top 3 meta Pokémon by win rate (min 5,000 games), each as a row: sprite, name, win %, games. Plus one line for the top archetype: "Top archetype: Incineroar + Sinistcha · 29.4% of teams".
- Tap a Pokémon row → opens the existing Database detail sheet. Tap the archetype line → Teams/Archetypes tab.
- **Trend arrows (dormant until data exists):** when ≥2 monthly Smogon snapshots are cached (from ~Aug 6), show ▲/▼ vs last month next to win rates. Same dormancy pattern as the sparkline — render nothing extra until real data exists.
- Label the section with the usual provenance ("Pikalytics · Smogon · Limitless") in the existing footer style.
- Section header: "META PULSE" with the snapshot date.

## 3. Height behavior (the actual gap fix)

- On viewports where content still ends short of the nav (large desktop), Meta Pulse absorbs the slack — its rows have comfortable spacing at 844px-class heights and the section sits flush above the nav clearance, no dead band.
- On small phones where Home already scrolls, Meta Pulse simply extends the scroll — verify no regression of the Sprint 7 dvh/safe-area work at 390×844 emulation.
- Desktop 1440 and the user's screenshot case (~1226px viewport height in-frame): screenshot before/after for the report.

## 4. Small carried items

- iPhone re-check from Sprint 7 is still pending from the user; if he reports issues, they take priority within this sprint.
- Keep an eye on the Aug 6 Smogon cron — nothing to do, but Sprint 10 planning assumes the 2026-07 snapshot lands and lights up sparkline + trend arrows.

## Out of scope

Community bring/lead collection, LLM digest, iOS wrap, Play Store prep (blocked on the sprite IP decision) — these are the Sprint 10+ menu, user picks after his Android test.

## User action items (carried)

- Download `champions-vault-debug-apk` from the Actions tab, install, test the share sheet → OCR flow.
- iPhone re-check of Home.
- Confirm/override appId `com.cristoffer.championsvault` (only matters before any store submission).

## Definition of done

No dead band at desktop or phone heights (before/after screenshots); Meta Pulse live with real cached data, tap-throughs working, trend arrows dormant; Sprint 7 mobile work regression-free; build passes; deployed; anomalies reported per standing workflow.
