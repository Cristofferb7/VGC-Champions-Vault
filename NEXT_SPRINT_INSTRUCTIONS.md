# Champions Analyzer — Review Findings & Next Sprint (paste into Claude Code)

Reviewed live at localhost:5180 on 2026-07-10. Console is clean (the one exception logged is from a Chrome extension, not the app). Everything below is ordered by priority.

## P0 — Bugs to fix first

1. **Bottom nav active-state desync.** Navigating to Database leaves "Home" highlighted; sometimes two tabs appear active. Check `useNavigation.ts` / `BottomNav.tsx` — active tab should derive from a single source of truth, not local highlight state.
2. **Threat matrix clipped.** The 6th opponent column is cut off with no horizontal-scroll affordance. Make the grid horizontally scrollable with: sticky left column (your team), a right-edge fade gradient as scroll hint, and snap-to-column scrolling.
3. **Matchup detail renders below the fold.** Tapping a cell shows the FAVORABLE/UNFAVORABLE panel off-screen. Either auto-`scrollIntoView({behavior:'smooth'})` or, better, present it as a bottom sheet that slides over the grid (more mobile-native, matches the app's style).
4. **"2X ICE WEAK" badge is misleading.** Garchomp alone is 4x ice-weak. Decide the semantics: if it means "2 team members weak to Ice," label it "ICE ×2 MONS"; if it's a multiplier, compute it correctly from `typeChart.ts`. Show the top 2–3 team-wide weaknesses, tappable to see which members cause each.
5. **Win-rate bars use inconsistent scale.** 49.55% renders far shorter than 50.90%. Use one fixed scale (0–100 or 40–70 zoomed range, but the same for all rows).
6. **"Long press to edit" has no desktop path.** Add right-click / kebab-menu equivalent, and make the hint conditional on pointer type (`@media (hover: hover)`).
7. **Camera FAB overlaps roster carousel content.** Add bottom padding to scroll containers equal to FAB clearance.

## P1 — Database screen (the Pikalytics-style core, currently a placeholder)

Wire real data per the brief (CHAMPIONS_ANALYZER_BRIEF.md):

- Fetch from the **Pikalytics AI API** (`GET /ai/pokedex/battledataregmbs3`, markdown responses — parse per the eurekaffeine/pokemon-champions-scraper approach). Add "Data: Pikalytics" attribution in the footer (required).
- **Usage list view:** rank, sprite, name, types, usage %, win % — searchable (fuzzy) and sortable. Virtualize the list (100+ rows).
- **Per-Pokémon detail sheet** (tap a row → bottom sheet, Pikalytics-style): moves % (top 8), items %, abilities %, nature+spread distribution, top teammates with %. Horizontal bars for each %, animated on mount.
- **Cache the snapshot** in IndexedDB with a fetched-at timestamp; app boots from cache and revalidates with `If-Modified-Since`. The "DATA READY" pill on Home should reflect real cache state (fresh / stale / syncing).
- If CORS blocks direct fetch in dev, add a tiny Vite dev-server proxy — do NOT stand up the Express backend yet; that's a later sprint.

## P2 — Analyzer upgrades

- **Opponent team entry:** manual picker first (search from the cached usage list, pick up to 6). The camera FAB can open this entry screen for now; screenshot recognition stays deferred per brief.
- **Real matchup math:** current `lib/matchup.ts` is type-chart-only. Keep it as fallback, but add `@smogon/calc` for actual damage ranges vs your saved team's default spreads. Label everything "usage-based likelihood," show raw % beside every claim.
- **Speed tiers strip:** for the two Pokémon in the detail panel, show a min/max speed bar comparison at level 50 — who likely moves first and at what likelihood given spread usage.
- **Lead likelihood row:** from usage lead stats when available; otherwise hide, never fake it.

## P3 — Team Builder (currently placeholder)

- Start a roster from a Top Teams entry ("Clone & edit").
- Manual builder: 6 slots, search from cached meta list, live team-weakness summary (reuse the fixed weakness logic from P0-4) and coverage grid updating as you add members.
- Persist rosters to IndexedDB (replace mock `data/teams.ts` as source of truth; keep it as seed data).

## Polish (weave into each sprint, don't batch at the end)

- Add `motion` (Framer Motion successor) — spring-based screen transitions matching bottom-nav direction, staggered list mounts, animated number count-ups on percentages, layout animation when the matchup sheet opens.
- Skeleton loaders for anything data-backed; no spinners.
- Empty states get a CTA button, not just copy (e.g. Team Builder → "Start from a top team").
- Desktop: center the app in a subtle device frame with a soft ambient gradient behind it so the wide-viewport experience feels intentional (this is a portfolio piece).
- Wire or remove the notification bell — a dead red dot on a portfolio piece reads as a bug.

## Data correctness checks while wiring real data

- Top Teams currently shows Gen-1-flavored mock teams (Mewtwo/Gengar/Zapdos...) — replace with real Reg M-B archetypes from usage teammates data as soon as P1 lands.
- Move %s from chaos data sum to ~400% (4 slots) — never multiply naively (brief covers this).
- Keep format code `battledataregmbs3` in one config constant; Season 4 rolls over Sept 2, 2026.
