# Sprint 5 — One gesture fix, then the Smogon data layer

Cowork QA of Sprint 4 on https://champions-analyzer.vercel.app (2026-07-11): **everything passes except one item.** Live data through the rewrite on a cold origin ✓, sheet X first-click ✓, nav-through-sheet ✓, both parser-artifact teams fixed ✓, matrix column at scrollLeft 0 ✓, Likely Brings gating + labeling ✓, transitions smooth on a visible screen ✓ (your hidden-tab theory was correct).

## 1. Fix: sheet drag-dismiss ignores mouse pointers (only QA failure)

On desktop, press-dragging the drag handle does nothing — the sheet doesn't move, and the drag selects text in the sheet body instead ("GARCHOMP" ended up highlighted). Touch may work, but desktop mouse must too:

- Use pointer events (motion's `drag="y"` handles this natively — check whether the handler is `onTouchStart`-based or the handle's hit area is only the 32px bar; widen to the full header row).
- `touch-action: none` on the handle, `user-select: none` on sheet header/handle (and during any active drag, on the body).
- Accept the drag anywhere on the sheet header, not just the handle pixels.
- While here: `Escape` key should also close the sheet (desktop nicety, free a11y win).

## 2. Feature: Smogon chaos ingest — the app's second data source (headline)

Per DATA_PLATFORM_RESEARCH.md §7 v1.5. Monthly Smogon stats for `gen9championsvgc2026regmb` unlock what Pikalytics' API doesn't have: full **spread distributions** and **Checks & Counters** matrices.

**Architecture — zero backend (decided):** a GitHub Action on a monthly cron (stats land ~5th of each month) downloads `https://www.smogon.com/stats/YYYY-MM/chaos/gen9championsvgc2026regmb-1760.json.gz` (and `-0` baseline), converts to a trimmed snapshot JSON (only fields the app uses), and commits it to `public/snapshots/smogon/YYYY-MM.json`. Vercel redeploys on push automatically. The app fetches same-origin — no CORS, no proxy, no server.

- Schema reference: `github.com/pkmn/stats` OUTPUT.md. Move %s sum to ~400 (4 slots) — brief rules apply: sample without replacement, never naive top-N.
- Trim aggressively: top 8 moves/items/abilities, top 6 spreads, top 10 C&C entries per species, drop sub-0.5%-usage species. Target snapshot ≤ 300 KB gz.
- Keep BOTH cutoffs (0 and 1760) — label as "all ladder" vs "top ladder" and let the Database screen toggle.
- Also grab the matching `leads/` report in the same run — if it has this format, that unlocks honest lead likelihood (the thing we've been correctly refusing to fake).
- Blend note from the brief: Showdown ladder ≠ cartridge ladder. Label the source on every Smogon-derived number ("Showdown, May 2026").

**Surface it in the UI:**
- Database detail sheet: spread *distribution* (top 5 with %s, not just the single top spread), and a "Checks & Counters" section (top 5 with KO/switch %).
- Threat matrix: where C&C data exists for a pairing, blend it into the Good/Bad/Neutral rating (type math stays the fallback) — tag cells that used real matchup data with a small dot; explain in the cell detail sheet.
- Snapshot history: never delete old monthly files; add a usage-trend sparkline (last 3–6 months) to the species detail sheet once ≥2 snapshots exist. Commit the current month now so history starts accruing.

## 3. Small items

- Lighthouse perf is 88 — check the two usual suspects before anything exotic: font/sprite preloading and the initial JS chunk size. Don't chase past ~92; diminishing returns.
- The share PNG and Showdown export should include the Smogon source label when any Smogon-derived number appears.
- README: document the GitHub Action + snapshot layout.

## User action items (not Claude Code)

- Test share-to-app on a real Android phone (install PWA → screenshot a team preview → share → should land in OCR). Nobody has run this on-device yet.
- When Season 4 starts (Sept 2, 2026): update the format constant in `src/config.ts` and the Action's format code.

## Definition of done

Sheet drag works with a mouse (QA will retest with real drags); monthly Action merged and has produced at least one committed snapshot; Database shows spread distributions + C&C with source labels; matrix cells using C&C data are tagged; build passes; deployed; report anomalies per the standing workflow.
